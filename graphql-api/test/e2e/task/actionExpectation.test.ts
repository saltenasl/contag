import { DAY_IN_MS } from 'src/constants'
import type { User } from 'src/generated/graphql'
import {
  ActionExpectationType,
  ItemsSortOrder,
  ItemsSortType,
  TaskStatus,
} from 'src/generated/graphql'
import getItems from '../drivers/items/get'
import amendTask from '../drivers/task/amend'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('task action expectation', () => {
  it('sends a task with action required', async () => {
    const author = await createUser()
    const task = await createTask({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(task.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })
  })

  it('sends a task with action required with a deadline', async () => {
    const author = await createUser()

    const completeUntil = new Date(Date.now() + DAY_IN_MS)

    const task = await createTask({
      author,
      actionExpectation: { completeUntil },
      shareWith: [],
    })

    expect(task.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: completeUntil.toISOString(),
      fulfilled: false,
    })
  })

  it('sends a task with action required from a specific person that is not current user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const otherUser = clientMemberUsers[0] as User
    const task = await createTask({
      author,
      to: [otherUser],
      actionExpectation: {},
      shareWith: [],
    })

    expect(task.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpected,
      completeUntil: null,
      fulfilled: false,
    })
  })

  describe('feed', () => {
    it('returns action required', async () => {
      const author = await createUser()
      const task = await createTask({
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

      expect(feed).toStrictEqual([task])
    })
  })

  it('task status moved to done fulfills the action requirement', async () => {
    const author = await createUser()
    const task = await createTask({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(task.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })

    const updatedTask = await amendTask({
      id: task.id,
      author,
      status: TaskStatus.Done,
    })

    expect(updatedTask).toStrictEqual({
      ...task,
      actionExpectation: {
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: true,
      },
      status: TaskStatus.Done,
      updatedAt: expect.any(String),
    })
  })

  it('task status moved from done back to todo unfulfills the action requirement', async () => {
    const author = await createUser()
    const task = await createTask({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    const doneTask = await amendTask({
      id: task.id,
      author,
      status: TaskStatus.Done,
    })

    expect(doneTask.actionExpectation?.fulfilled).toBe(true)

    const todoTask = await amendTask({
      id: task.id,
      author,
      status: TaskStatus.Todo,
    })

    expect(todoTask.actionExpectation?.fulfilled).toBe(false)
  })

  describe('amend', () => {
    it("doesn't remove action expected", async () => {
      const author = await createUser()
      const task = await createTask({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(task.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        actionExpectation: null,
      })

      expect(updatedTask).toStrictEqual({
        ...task,
        updatedAt: expect.any(String),
      })
    })

    it('removes completeUntil', async () => {
      const author = await createUser()
      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const task = await createTask({
        author,
        actionExpectation: { completeUntil },
        shareWith: [],
      })

      expect(task.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: completeUntil.toISOString(),
        fulfilled: false,
      })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        actionExpectation: { completeUntil: null },
      })

      expect(updatedTask).toStrictEqual({
        ...task,
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
      const task = await createTask({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(task.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const updatedTask = await amendTask({
        id: task.id,
        author,
        actionExpectation: { completeUntil },
      })

      expect(updatedTask).toStrictEqual({
        ...task,
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
