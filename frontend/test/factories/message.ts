import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { Message } from 'src/generated/graphql'
import itemIdFactory from './item/id'
import publicUserFactory from './publicUser'

const baseMessageFactory = Sync.makeFactory<Message>(() => {
  const author = publicUserFactory.build()

  return {
    __typename: 'Message',
    parentId: null,
    id: each(() => itemIdFactory.build().id),
    author,
    text: each(() => faker.lorem.sentence()),
    richText: null,
    to: [],
    sharedWith: each(() => [author, publicUserFactory.build()]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    childCount: 0,
    isAcceptedAnswer: null,
    summary: null,
    attachments: [],
    goals: [],
    blocks: [],
    blockedBy: [],
  }
})

const messages: Partial<Record<string, Message>> = {}

const wrapFactory = (
  factory: Factory<Message>
): {
  build: (typeof baseMessageFactory)['build']
  buildList: (typeof baseMessageFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const messageInCache = messages[item.id]

      if (messageInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...messageInCache,
          ...item,
        })
        messages[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const message = factory.build(item)

    messages[message.id] = message

    return message
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const messageFactory = wrapFactory(baseMessageFactory)

export const getMessage = (id: string) => {
  const message = messages[id]
  if (message) {
    return message
  }

  throw new Error(`message with id "${id}" not found in message store!`)
}

export const getAllMessagesWithParent = (parentId: string) =>
  Object.values(messages).filter(
    (message): message is Message => !!message && message.parentId === parentId
  )

export default messageFactory
