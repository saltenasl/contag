import type { Item, User } from 'src/generated/graphql'
import sendMessage from './drivers/message/send'
import createInfo from './drivers/info/create'
import createQuestion from './drivers/question/create'
import createUser from './drivers/user/create'
import createGoal from './drivers/goal/create'
import createTask from './drivers/task/create'
import updateItemIsBlockedBy, {
  mutateUpdateItemIsBlockedBy,
} from './drivers/item/updateItemIsBlockedBy'
import createMultipleUsersAndAddToTheSameClient from './drivers/user/createMultipleAndAddToClient'
import getItem from './drivers/item/get'

describe('updateItemIsBlockedBy', () => {
  describe('add', () => {
    it('adds one', async () => {
      const author = await createUser()
      const item = await createGoal({ author, shareWith: [] })
      const blockedByItem = await createTask({ author, shareWith: [] })

      const updatedItem = await updateItemIsBlockedBy({
        itemId: item.id,
        blockedByAdded: [{ id: blockedByItem.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          blockedBy: [
            {
              id: blockedByItem.id,
            },
          ],
        })
      )
    })

    it.each`
      createItemDriver  | type
      ${sendMessage}    | ${'message'}
      ${createGoal}     | ${'goal'}
      ${createTask}     | ${'task'}
      ${createInfo}     | ${'info'}
      ${createQuestion} | ${'question'}
    `(
      "$type query doesn't return items current item is blocked by which were not shared with the current user",
      async ({ createItemDriver }) => {
        const { clientAdminUser: firstUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const secondUser = clientMemberUsers[0] as User

        const item = (await createItemDriver({
          author: firstUser,
          shareWith: [secondUser],
        })) as Item
        const firstUserItemIsBlockedBy = await createGoal({
          author: firstUser,
          shareWith: [],
        })
        const secondUserItemIsBlockedBy = await createGoal({
          author: secondUser,
          shareWith: [],
        })

        await updateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [{ id: firstUserItemIsBlockedBy.id }],
          loggedInAs: firstUser,
        })

        const updatedItem = await updateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [{ id: secondUserItemIsBlockedBy.id }],
          loggedInAs: secondUser,
        })

        expect(updatedItem.blockedBy).toStrictEqual([
          { id: secondUserItemIsBlockedBy.id },
        ])
      }
    )

    it.each`
      createItemDriver  | type
      ${sendMessage}    | ${'message'}
      ${createGoal}     | ${'goal'}
      ${createTask}     | ${'task'}
      ${createInfo}     | ${'info'}
      ${createQuestion} | ${'question'}
    `(
      'when item A of type $type is added to item B `blockedBy`, item A now `blocks` item B',
      async ({ createItemDriver }) => {
        const author = await createUser()

        const itemA = await createItemDriver({ author, shareWith: [] })
        const itemB = await createItemDriver({ author, shareWith: [] })

        await updateItemIsBlockedBy({
          itemId: itemB.id,
          blockedByAdded: [{ id: itemA.id }],
          loggedInAs: author,
        })

        const updatedItemA = await getItem({ loggedInAs: author, id: itemA.id })

        expect(updatedItemA.blocks).toStrictEqual([{ id: itemB.id }])
      }
    )

    describe('errors', () => {
      it("returns not found when user has no access to the item they're trying to add as a blocked by item", async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User

        const item = await createGoal({ author, shareWith: [otherUser] })
        const blockedByItem = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateItemIsBlockedBy({
          loggedInAs: otherUser,
          itemId: item.id,
          blockedByAdded: [{ id: blockedByItem.id }],
          blockedByRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked by not found',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })

      it('returns not found when passed non-existent itemId', async () => {
        const author = await createUser()

        const response = await mutateUpdateItemIsBlockedBy({
          loggedInAs: author,
          itemId: 'Item:-1',
          blockedByAdded: [],
          blockedByRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })

      it('returns conflict when any of the passed items current item is blocked by are already added', async () => {
        const author = await createUser()
        const item = await createGoal({ author, shareWith: [] })
        const blockedByItem = await createTask({ author, shareWith: [] })

        await updateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [{ id: blockedByItem.id }],
          loggedInAs: author,
        })

        const response = await mutateUpdateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [{ id: blockedByItem.id }],
          blockedByRemoved: [],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked by already added',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })

      describe('item is blocked by forming a loop and blocking themselves', () => {
        it('error when trying to block self item', async () => {
          const author = await createUser()
          const item = await createGoal({ author, shareWith: [] })

          const response = await mutateUpdateItemIsBlockedBy({
            itemId: item.id,
            blockedByAdded: [{ id: item.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemIsBlockedBy: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot be blocked by itself',
                path: ['updateItemIsBlockedBy'],
              }),
            ],
          })
        })

        it('error when blocked by item is blocked by self item', async () => {
          const author = await createUser()
          const item = await createGoal({ author, shareWith: [] })
          const blockingItem = await createGoal({ author, shareWith: [] })

          await updateItemIsBlockedBy({
            itemId: blockingItem.id,
            blockedByAdded: [{ id: item.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          const response = await mutateUpdateItemIsBlockedBy({
            itemId: item.id,
            blockedByAdded: [{ id: blockingItem.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemIsBlockedBy: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot be blocked by itself',
                path: ['updateItemIsBlockedBy'],
              }),
            ],
          })
        })

        it('error when blocked by item is blocked by another item that is blocked by self item', async () => {
          const author = await createUser()
          const firstItem = await createGoal({ author, shareWith: [] })
          const secondItem = await createGoal({ author, shareWith: [] })
          const thirdItem = await createGoal({ author, shareWith: [] })

          await updateItemIsBlockedBy({
            itemId: secondItem.id,
            blockedByAdded: [{ id: firstItem.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          await updateItemIsBlockedBy({
            itemId: thirdItem.id,
            blockedByAdded: [{ id: secondItem.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          const response = await mutateUpdateItemIsBlockedBy({
            itemId: firstItem.id,
            blockedByAdded: [{ id: thirdItem.id }],
            blockedByRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemIsBlockedBy: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot be blocked by itself',
                path: ['updateItemIsBlockedBy'],
              }),
            ],
          })
        })
      })
    })
  })

  describe('remove', () => {
    const createGoalAndAddToItemIsBlockedBy = async () => {
      const author = await createUser()
      const item = await createGoal({ author, shareWith: [] })
      const blockedByItem = await createGoal({ author, shareWith: [] })
      await updateItemIsBlockedBy({
        itemId: item.id,
        blockedByAdded: [{ id: blockedByItem.id }],
        loggedInAs: author,
      })

      return { author, item, blockedByItem }
    }

    it('removes a blocked by item', async () => {
      const { author, blockedByItem, item } =
        await createGoalAndAddToItemIsBlockedBy()

      const updatedItem = await updateItemIsBlockedBy({
        itemId: item.id,
        blockedByRemoved: [{ id: blockedByItem.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          blockedBy: [],
        })
      )
    })

    describe('errors', () => {
      it('cannot remove items current item is blocked by from an item that user has no access to', async () => {
        const { blockedByItem, item } =
          await createGoalAndAddToItemIsBlockedBy()
        const anotherUser = await createUser()

        const response = await mutateUpdateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [],
          blockedByRemoved: [{ id: blockedByItem.id }],
          loggedInAs: anotherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })

      it('cannot remove a non-added blocked by item', async () => {
        const { item, author } = await createGoalAndAddToItemIsBlockedBy()
        const blockedByItem = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [],
          blockedByRemoved: [{ id: blockedByItem.id }],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked by not found',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })

      it('cannot remove blocked by item to which current user has no access', async () => {
        const { clientAdminUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User
        const item = await createGoal({
          author: clientAdminUser,
          shareWith: [otherUser],
        })
        const blockedByItem = await createGoal({
          author: clientAdminUser,
          shareWith: [],
        })

        await updateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [{ id: blockedByItem.id }],
          loggedInAs: clientAdminUser,
        })

        const response = await mutateUpdateItemIsBlockedBy({
          itemId: item.id,
          blockedByAdded: [],
          blockedByRemoved: [{ id: blockedByItem.id }],
          loggedInAs: otherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemIsBlockedBy: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked by not found',
              path: ['updateItemIsBlockedBy'],
            }),
          ],
        })
      })
    })
  })
})
