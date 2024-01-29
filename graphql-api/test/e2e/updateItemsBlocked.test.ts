import type { Item, User } from 'src/generated/graphql'
import sendMessage from './drivers/message/send'
import createInfo from './drivers/info/create'
import createQuestion from './drivers/question/create'
import createUser from './drivers/user/create'
import createGoal from './drivers/goal/create'
import createTask from './drivers/task/create'
import updateItemsBlocked, {
  mutateUpdateItemsBlocked,
} from './drivers/item/updateItemsBlocked'
import createMultipleUsersAndAddToTheSameClient from './drivers/user/createMultipleAndAddToClient'
import getItem from './drivers/item/get'

describe('updateItemsBlocked', () => {
  describe('add', () => {
    it('adds one', async () => {
      const author = await createUser()
      const item = await createGoal({ author, shareWith: [] })
      const blockedItem = await createTask({ author, shareWith: [] })

      const updatedItem = await updateItemsBlocked({
        itemId: item.id,
        itemsBlockedAdded: [{ id: blockedItem.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          blocks: [
            {
              id: blockedItem.id,
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
      "$type query doesn't return items blocked which were not shared with the current user",
      async ({ createItemDriver }) => {
        const { clientAdminUser: firstUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const secondUser = clientMemberUsers[0] as User

        const item = (await createItemDriver({
          author: firstUser,
          shareWith: [secondUser],
        })) as Item
        const firstUserItemsBlocked = await createGoal({
          author: firstUser,
          shareWith: [],
        })
        const secondUserItemsBlocked = await createGoal({
          author: secondUser,
          shareWith: [],
        })

        await updateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [{ id: firstUserItemsBlocked.id }],
          loggedInAs: firstUser,
        })

        const updatedItem = await updateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [{ id: secondUserItemsBlocked.id }],
          loggedInAs: secondUser,
        })

        expect(updatedItem.blocks).toStrictEqual([
          { id: secondUserItemsBlocked.id },
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
      'when item A of type $type is added to item B `blocks`, item A is now `blockedBy` item B',
      async ({ createItemDriver }) => {
        const author = await createUser()

        const itemA = await createItemDriver({ author, shareWith: [] })
        const itemB = await createItemDriver({ author, shareWith: [] })

        await updateItemsBlocked({
          itemId: itemB.id,
          itemsBlockedAdded: [{ id: itemA.id }],
          loggedInAs: author,
        })

        const updatedItemA = await getItem({ loggedInAs: author, id: itemA.id })

        expect(updatedItemA.blockedBy).toStrictEqual([{ id: itemB.id }])
      }
    )

    describe('errors', () => {
      it("returns not found when user has no access to the item they're trying to add as a blocked item", async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User

        const item = await createGoal({ author, shareWith: [otherUser] })
        const blockedItem = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateItemsBlocked({
          loggedInAs: otherUser,
          itemId: item.id,
          itemsBlockedAdded: [{ id: blockedItem.id }],
          itemsBlockedRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked not found',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })

      it('returns not found when passed non-existent itemId', async () => {
        const author = await createUser()

        const response = await mutateUpdateItemsBlocked({
          loggedInAs: author,
          itemId: 'Item:-1',
          itemsBlockedAdded: [],
          itemsBlockedRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })

      it('returns conflict when any of the passed items blocked are already added', async () => {
        const author = await createUser()
        const item = await createGoal({ author, shareWith: [] })
        const blockedItem = await createTask({ author, shareWith: [] })

        await updateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [{ id: blockedItem.id }],
          loggedInAs: author,
        })

        const response = await mutateUpdateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [{ id: blockedItem.id }],
          itemsBlockedRemoved: [],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked already added',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })

      describe('item blocked forming a loop and blocking themselves', () => {
        it('error when trying to block self item', async () => {
          const author = await createUser()
          const item = await createGoal({ author, shareWith: [] })

          const response = await mutateUpdateItemsBlocked({
            itemId: item.id,
            itemsBlockedAdded: [{ id: item.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemsBlocked: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot block itself',
                path: ['updateItemsBlocked'],
              }),
            ],
          })
        })

        it('error when blocked item blocks self item', async () => {
          const author = await createUser()
          const item = await createGoal({ author, shareWith: [] })
          const blockingItem = await createGoal({ author, shareWith: [] })

          await updateItemsBlocked({
            itemId: blockingItem.id,
            itemsBlockedAdded: [{ id: item.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          const response = await mutateUpdateItemsBlocked({
            itemId: item.id,
            itemsBlockedAdded: [{ id: blockingItem.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemsBlocked: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot block itself',
                path: ['updateItemsBlocked'],
              }),
            ],
          })
        })

        it('error when blocked item blocks another item that blocks self item', async () => {
          const author = await createUser()
          const firstItem = await createGoal({ author, shareWith: [] })
          const secondItem = await createGoal({ author, shareWith: [] })
          const thirdItem = await createGoal({ author, shareWith: [] })

          await updateItemsBlocked({
            itemId: secondItem.id,
            itemsBlockedAdded: [{ id: firstItem.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          await updateItemsBlocked({
            itemId: thirdItem.id,
            itemsBlockedAdded: [{ id: secondItem.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          const response = await mutateUpdateItemsBlocked({
            itemId: firstItem.id,
            itemsBlockedAdded: [{ id: thirdItem.id }],
            itemsBlockedRemoved: [],
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              updateItemsBlocked: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Item cannot block itself',
                path: ['updateItemsBlocked'],
              }),
            ],
          })
        })
      })
    })
  })

  describe('remove', () => {
    const createGoalAndAddItemsBlocked = async () => {
      const author = await createUser()
      const item = await createGoal({ author, shareWith: [] })
      const blockedItem = await createGoal({ author, shareWith: [] })
      await updateItemsBlocked({
        itemId: item.id,
        itemsBlockedAdded: [{ id: blockedItem.id }],
        loggedInAs: author,
      })

      return { author, item, blockedItem }
    }

    it('removes a blocked item', async () => {
      const { author, blockedItem, item } = await createGoalAndAddItemsBlocked()

      const updatedItem = await updateItemsBlocked({
        itemId: item.id,
        itemsBlockedRemoved: [{ id: blockedItem.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          blocks: [],
        })
      )
    })

    describe('errors', () => {
      it('cannot remove items blocked from an item that user has no access to', async () => {
        const { blockedItem, item } = await createGoalAndAddItemsBlocked()
        const anotherUser = await createUser()

        const response = await mutateUpdateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [],
          itemsBlockedRemoved: [{ id: blockedItem.id }],
          loggedInAs: anotherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })

      it('cannot remove a non-added blocked item', async () => {
        const { item, author } = await createGoalAndAddItemsBlocked()
        const blockedItem = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [],
          itemsBlockedRemoved: [{ id: blockedItem.id }],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked not found',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })

      it('cannot remove blockedItem to which current user has no access', async () => {
        const { clientAdminUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User
        const item = await createGoal({
          author: clientAdminUser,
          shareWith: [otherUser],
        })
        const blockedItem = await createGoal({
          author: clientAdminUser,
          shareWith: [],
        })

        await updateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [{ id: blockedItem.id }],
          loggedInAs: clientAdminUser,
        })

        const response = await mutateUpdateItemsBlocked({
          itemId: item.id,
          itemsBlockedAdded: [],
          itemsBlockedRemoved: [{ id: blockedItem.id }],
          loggedInAs: otherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemsBlocked: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item(s) blocked not found',
              path: ['updateItemsBlocked'],
            }),
          ],
        })
      })
    })
  })
})
