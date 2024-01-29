import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { Question } from 'src/generated/graphql'
import actionExpectationFactory from './actionExpectation'
import itemIdFactory from './item/id'
import publicUserFactory from './publicUser'

const baseQuestionFactory = Sync.makeFactory<Question>(() => {
  const author = publicUserFactory.build()

  return {
    __typename: 'Question',
    id: each(() => itemIdFactory.build().id),
    parentId: null,
    author,
    text: each(() => faker.lorem.sentence()),
    richText: null,
    to: [],
    sharedWith: each(() => [author, publicUserFactory.build()]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    childCount: 0,
    isAcceptedAnswer: null,
    acceptedAnswer: null,
    actionExpectation: actionExpectationFactory.build(),
    summary: null,
    attachments: [],
    goals: [],
    blocks: [],
    blockedBy: [],
  }
})

const questions: Partial<Record<string, Question>> = {}

const wrapFactory = (
  factory: Factory<Question>
): {
  build: (typeof baseQuestionFactory)['build']
  buildList: (typeof baseQuestionFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const questionInCache = questions[item.id]

      if (questionInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...questionInCache,
          ...item,
        })
        questions[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const question = factory.build(item)

    questions[question.id] = question

    return question
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const questionFactory = wrapFactory(baseQuestionFactory)

export const getQuestion = (id: string) => {
  const question = questions[id]
  if (question) {
    return question
  }

  throw new Error(`question with id "${id}" not found in question store!`)
}

export const getAllQuestionsWithParent = (parentId: string) =>
  Object.values(questions).filter(
    (question): question is Question =>
      !!question && question.parentId === parentId
  )

export default questionFactory
