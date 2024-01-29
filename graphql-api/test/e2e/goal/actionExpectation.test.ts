import { DAY_IN_MS } from 'src/constants'
import type { User } from 'src/generated/graphql'
import {
  ActionExpectationType,
  ItemsSortOrder,
  ItemsSortType,
  GoalStatus,
} from 'src/generated/graphql'
import getItems from '../drivers/items/get'
import amendGoal from '../drivers/goal/amend'
import createGoal from '../drivers/goal/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('goal action expectation', () => {
  it('creates a goal with action required', async () => {
    const author = await createUser()
    const goal = await createGoal({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(goal.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })
  })

  it('creates a goal with action required with a deadline', async () => {
    const author = await createUser()

    const completeUntil = new Date(Date.now() + DAY_IN_MS)

    const goal = await createGoal({
      author,
      actionExpectation: { completeUntil },
      shareWith: [],
    })

    expect(goal.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: completeUntil.toISOString(),
      fulfilled: false,
    })
  })

  it('creates a goal with action required from a specific person that is not current user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const otherUser = clientMemberUsers[0] as User
    const goal = await createGoal({
      author,
      to: [otherUser],
      actionExpectation: {},
      shareWith: [],
    })

    expect(goal.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpected,
      completeUntil: null,
      fulfilled: false,
    })
  })

  describe('feed', () => {
    it('returns action required', async () => {
      const author = await createUser()
      const goal = await createGoal({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      const feed = await getItems({
        loggedInAs: author,
        filters: {},
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.NewestFirst,
        },
      })

      expect(feed).toStrictEqual([goal])
    })
  })

  it('goal status moved to done fulfills the action requirement', async () => {
    const author = await createUser()
    const goal = await createGoal({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(goal.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })

    const updatedGoal = await amendGoal({
      id: goal.id,
      loggedInAs: author,
      goalStatus: GoalStatus.Done,
    })

    expect(updatedGoal).toStrictEqual({
      ...goal,
      actionExpectation: {
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: true,
      },
      goalStatus: GoalStatus.Done,
      updatedAt: expect.any(String),
    })
  })

  it('goal status moved from done back to todo unfulfills the action requirement', async () => {
    const author = await createUser()
    const goal = await createGoal({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    const doneGoal = await amendGoal({
      id: goal.id,
      loggedInAs: author,
      goalStatus: GoalStatus.Done,
    })

    expect(doneGoal.actionExpectation?.fulfilled).toBe(true)

    const todoGoal = await amendGoal({
      id: goal.id,
      loggedInAs: author,
      goalStatus: GoalStatus.Todo,
    })

    expect(todoGoal.actionExpectation?.fulfilled).toBe(false)
  })

  describe('amend', () => {
    it("doesn't remove action expected", async () => {
      const author = await createUser()
      const goal = await createGoal({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(goal.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        actionExpectation: null,
      })

      expect(updatedGoal).toStrictEqual({
        ...goal,
        updatedAt: expect.any(String),
      })
    })

    it('removes completeUntil', async () => {
      const author = await createUser()
      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const goal = await createGoal({
        author,
        actionExpectation: { completeUntil },
        shareWith: [],
      })

      expect(goal.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: completeUntil.toISOString(),
        fulfilled: false,
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        actionExpectation: { completeUntil: null },
      })

      expect(updatedGoal).toStrictEqual({
        ...goal,
        updatedAt: expect.any(String),
        actionExpectation: {
          type: ActionExpectationType.ActionExpectedFromYou,
          completeUntil: null,
          fulfilled: false,
        },
      })
    })

    it('adds completeUntil', async () => {
      const author = await createUser()
      const goal = await createGoal({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(goal.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        actionExpectation: { completeUntil },
      })

      expect(updatedGoal).toStrictEqual({
        ...goal,
        updatedAt: expect.any(String),
        actionExpectation: {
          type: ActionExpectationType.ActionExpectedFromYou,
          completeUntil: completeUntil.toISOString(),
          fulfilled: false,
        },
      })
    })
  })
})
