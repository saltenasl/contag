import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { Goal, GoalStatus } from 'src/generated/graphql'
import actionExpectationFactory from './actionExpectation'
import itemIdFactory from './item/id'
import publicUserFactory from './publicUser'

const baseGoalFactory = Sync.makeFactory<Goal>(() => {
  const author = publicUserFactory.build()

  return {
    __typename: 'Goal',
    parentId: null,
    id: each(() => itemIdFactory.build().id),
    author,
    text: each(() => faker.lorem.sentence()),
    richText: null,
    to: [],
    sharedWith: each(() => [author, publicUserFactory.build()]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    goalStatus: GoalStatus.Todo,
    childCount: 0,
    isAcceptedAnswer: null,
    actionExpectation: actionExpectationFactory.build(),
    summary: null,
    attachments: [],
    constituents: [],
    goals: [],
    blocks: [],
    blockedBy: [],
  }
})

const goals: Partial<Record<string, Goal>> = {}

const wrapFactory = (
  factory: Factory<Goal>
): {
  build: (typeof baseGoalFactory)['build']
  buildList: (typeof baseGoalFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const goalInCache = goals[item.id]

      if (goalInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...goalInCache,
          ...item,
        })
        goals[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const goal = factory.build(item)

    goals[goal.id] = goal

    return goal
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const goalFactory = wrapFactory(baseGoalFactory)

export const getGoal = (id: string) => {
  const goal = goals[id]
  if (goal) {
    return goal
  }

  throw new Error(`goal with id "${id}" not found in goal store!`)
}

export const getAllGoalsWithParent = (parentId: string) =>
  Object.values(goals).filter(
    (goal): goal is Goal => !!goal && goal.parentId === parentId
  )

export default goalFactory
