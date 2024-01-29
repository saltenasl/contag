import {
  VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS,
  VIEWING_FEED_POLL_INTERVAL_MS,
} from 'src/constants'
import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems from '../drivers/items/get'
import getPublicUsers from '../drivers/publicUsers/get'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('user items activity', () => {
  it('returns activity true for the user when he recently queried items with my parentId', async () => {
    const { clientAdminUser, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const toBeActiveUser = clientMemberUsers[0] as User
    const inactiveUser = clientMemberUsers[1] as User

    const myInitialItems = await getPublicUsers({
      loggedInAs: clientAdminUser,
    })

    expect(myInitialItems).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: toBeActiveUser.id,
          active: false,
        }),
        expect.objectContaining({
          id: inactiveUser.id,
          active: false,
        }),
      ])
    )

    await getItems({
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: { parentId: clientAdminUser.id },
      loggedInAs: toBeActiveUser,
    })

    const myItems = await getPublicUsers({
      loggedInAs: clientAdminUser,
    })

    expect(myItems).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: inactiveUser.id,
          active: false,
        }),
        expect.objectContaining({
          id: toBeActiveUser.id,
          active: true,
        }),
      ])
    )
  })

  describe('with fake timers', () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it(`active expires when user doesnt call viewingItems after ${VIEWING_FEED_POLL_INTERVAL_MS}ms + ${VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS}ms`, async () => {
      const { clientAdminUser, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const someUser = clientMemberUsers[0] as User

      await getItems({
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: { parentId: clientAdminUser.id },
        loggedInAs: someUser,
      })

      const initialItems = await getPublicUsers({
        loggedInAs: clientAdminUser,
      })

      expect(initialItems).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: someUser.id,
            active: true,
          }),
        ])
      )

      const MARGIN_OF_FLAKINESS_MS = 100
      jest.advanceTimersByTime(
        VIEWING_FEED_POLL_INTERVAL_MS +
          VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS +
          MARGIN_OF_FLAKINESS_MS
      )

      const myItems = await getPublicUsers({
        loggedInAs: clientAdminUser,
      })

      expect(myItems).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: someUser.id,
            active: false,
          }),
        ])
      )
    })
  })
})
