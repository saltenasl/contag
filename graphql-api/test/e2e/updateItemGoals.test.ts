import type { Item, User } from 'src/generated/graphql'
import createGoal from './drivers/goal/create'
import updateItemGoals, {
  mutateUpdateItemGoals,
} from './drivers/item/updateItemGoals'
import createInfo from './drivers/info/create'
import sendMessage from './drivers/message/send'
import createQuestion from './drivers/question/create'
import createTask from './drivers/task/create'
import createUser from './drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from './drivers/user/createMultipleAndAddToClient'

describe('updateItemGoals', () => {
  describe('add', () => {
    it('adds one', async () => {
      const author = await createUser()
      const item = await createTask({ author, shareWith: [] })
      const goal = await createGoal({ author, shareWith: [] })

      const updatedItem = await updateItemGoals({
        itemId: item.id,
        goalsAdded: [{ id: goal.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          goals: [
            {
              id: goal.id,
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
      "$type query doesn't return goals which were not shared with the current user",
      async ({ createItemDriver }) => {
        const { clientAdminUser: firstUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const secondUser = clientMemberUsers[0] as User

        const item = (await createItemDriver({
          author: firstUser,
          shareWith: [secondUser],
        })) as Item
        const firstUserGoal = await createGoal({
          author: firstUser,
          shareWith: [],
        })
        const secondUserGoal = await createGoal({
          author: secondUser,
          shareWith: [],
        })

        await updateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: firstUserGoal.id }],
          loggedInAs: firstUser,
        })

        const updatedItem = await updateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: secondUserGoal.id }],
          loggedInAs: secondUser,
        })

        expect(updatedItem.goals).toStrictEqual([{ id: secondUserGoal.id }])
      }
    )

    describe('errors', () => {
      it("returns not found when user has no access to the goal they're trying to associate with the item", async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User

        const goal = await createGoal({ author, shareWith: [otherUser] })
        const goalToWhichOtherUserHasNoAccess = await createGoal({
          author,
          shareWith: [],
        })

        const response = await mutateUpdateItemGoals({
          loggedInAs: otherUser,
          itemId: goal.id,
          goalsAdded: [{ id: goalToWhichOtherUserHasNoAccess.id }],
          goalsRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Goal(s) not found',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })

      it('returns conflict when any of the passed goals are already added', async () => {
        const author = await createUser()
        const item = await createTask({ author, shareWith: [] })
        const goal = await createGoal({ author, shareWith: [] })

        await updateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: goal.id }],
          loggedInAs: author,
        })

        const response = await mutateUpdateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: goal.id }],
          goalsRemoved: [],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Goal(s) already added',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })

      it('cannot associate item with non-goal item', async () => {
        const author = await createUser()
        const item = await createTask({ author, shareWith: [] })
        const task = await createTask({ author, shareWith: [] })

        const response = await mutateUpdateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: task.id }],
          goalsRemoved: [],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Non goal item(s) passed in goalsAdded',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })
    })
  })

  describe('remove', () => {
    const createItemAndAssociateWithGoal = async () => {
      const author = await createUser()
      const item = await createGoal({ author, shareWith: [] })
      const goal = await createGoal({ author, shareWith: [] })

      await updateItemGoals({
        itemId: item.id,
        goalsAdded: [{ id: goal.id }],
        loggedInAs: author,
      })

      return { author, item, goal }
    }

    it('removes goal', async () => {
      const { author, item, goal } = await createItemAndAssociateWithGoal()

      const updatedItem = await updateItemGoals({
        itemId: item.id,
        goalsRemoved: [{ id: goal.id }],
        loggedInAs: author,
      })

      expect(updatedItem).toStrictEqual(
        expect.objectContaining({
          goals: [],
        })
      )
    })

    describe('errors', () => {
      it('cannot remove goals from an item that user has no access to', async () => {
        const { item, goal } = await createItemAndAssociateWithGoal()
        const anotherUser = await createUser()

        const response = await mutateUpdateItemGoals({
          itemId: item.id,
          goalsAdded: [],
          goalsRemoved: [{ id: goal.id }],
          loggedInAs: anotherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })

      it('cannot remove a goal which was not added', async () => {
        const { item, author } = await createItemAndAssociateWithGoal()
        const goal = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateItemGoals({
          itemId: item.id,
          goalsAdded: [],
          goalsRemoved: [{ id: goal.id }],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Goal(s) not found',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })

      it('cannot delete goal to which current user has no access', async () => {
        const { clientAdminUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User
        const item = await createGoal({
          author: clientAdminUser,
          shareWith: [otherUser],
        })
        const goal = await createGoal({
          author: clientAdminUser,
          shareWith: [],
        })

        await updateItemGoals({
          itemId: item.id,
          goalsAdded: [{ id: goal.id }],
          loggedInAs: clientAdminUser,
        })

        const response = await mutateUpdateItemGoals({
          itemId: item.id,
          goalsAdded: [],
          goalsRemoved: [{ id: goal.id }],
          loggedInAs: otherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateItemGoals: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Goal(s) not found',
              path: ['updateItemGoals'],
            }),
          ],
        })
      })
    })
  })
})
