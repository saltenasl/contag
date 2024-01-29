import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { Info } from 'src/generated/graphql'
import actionExpectationFactory from './actionExpectation'
import itemIdFactory from './item/id'
import publicUserFactory from './publicUser'

const baseInfoFactory = Sync.makeFactory<Info>(() => {
  const author = publicUserFactory.build()

  return {
    __typename: 'Info',
    parentId: null,
    id: each(() => itemIdFactory.build().id),
    author,
    text: each(() => faker.lorem.sentence()),
    richText: null,
    acknowledged: false,
    to: [],
    sharedWith: each(() => [author, publicUserFactory.build()]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    childCount: 0,
    isAcceptedAnswer: null,
    actionExpectation: actionExpectationFactory.build(),
    summary: null,
    attachments: [],
    goals: [],
    blocks: [],
    blockedBy: [],
  }
})

const infos: Partial<Record<string, Info>> = {}

const wrapFactory = (
  factory: Factory<Info>
): {
  build: (typeof baseInfoFactory)['build']
  buildList: (typeof baseInfoFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const infoInCache = infos[item.id]

      if (infoInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...infoInCache,
          ...item,
        })
        infos[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const info = factory.build(item)

    infos[info.id] = info

    return info
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const infoFactory = wrapFactory(baseInfoFactory)

export const getInfo = (id: string) => {
  const info = infos[id]
  if (info) {
    return info
  }

  throw new Error(`info with id "${id}" not found in info store!`)
}

export const getAllInfosWithParent = (parentId: string) =>
  Object.values(infos).filter(
    (info): info is Info => !!info && info.parentId === parentId
  )

export default infoFactory
