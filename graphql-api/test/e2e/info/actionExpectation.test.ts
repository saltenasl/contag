import { DAY_IN_MS } from 'src/constants'
import type { User } from 'src/generated/graphql'
import {
  ActionExpectationType,
  ItemsSortOrder,
  ItemsSortType,
} from 'src/generated/graphql'
import getItems from '../drivers/items/get'
import amendInfo from '../drivers/info/amend'
import createInfo from '../drivers/info/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('info action expectation', () => {
  it('sends a info with action required', async () => {
    const author = await createUser()
    const info = await createInfo({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(info.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })
  })

  it('sends a info with action required with a deadline', async () => {
    const author = await createUser()

    const completeUntil = new Date(Date.now() + DAY_IN_MS)

    const info = await createInfo({
      author,
      actionExpectation: { completeUntil },
      shareWith: [],
    })

    expect(info.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: completeUntil.toISOString(),
      fulfilled: false,
    })
  })

  it('sends a info with action required from a specific person that is not current user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const otherUser = clientMemberUsers[0] as User
    const info = await createInfo({
      author,
      to: [otherUser],
      actionExpectation: {},
      shareWith: [],
    })

    expect(info.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpected,
      completeUntil: null,
      fulfilled: false,
    })
  })

  describe('feed', () => {
    it('returns action required', async () => {
      const author = await createUser()
      const info = await createInfo({
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

      expect(feed).toStrictEqual([info])
    })
  })

  it('acknowledging info fulfills the action requirement', async () => {
    const author = await createUser()
    const info = await createInfo({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(info.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })

    const updatedInfo = await amendInfo({
      id: info.id,
      loggedInAs: author,
      acknowledged: true,
    })

    expect(updatedInfo).toStrictEqual({
      ...info,
      actionExpectation: {
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: true,
      },
      acknowledged: true,
      updatedAt: expect.any(String),
    })
  })

  describe('amend', () => {
    it("doesn't remove action expected", async () => {
      const author = await createUser()
      const info = await createInfo({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(info.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        actionExpectation: null,
      })

      expect(updatedInfo).toStrictEqual({
        ...info,
        updatedAt: expect.any(String),
      })
    })

    it('removes completeUntil', async () => {
      const author = await createUser()
      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const info = await createInfo({
        author,
        actionExpectation: { completeUntil },
        shareWith: [],
      })

      expect(info.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: completeUntil.toISOString(),
        fulfilled: false,
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        actionExpectation: { completeUntil: null },
      })

      expect(updatedInfo).toStrictEqual({
        ...info,
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
      const info = await createInfo({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(info.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        actionExpectation: { completeUntil },
      })

      expect(updatedInfo).toStrictEqual({
        ...info,
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
