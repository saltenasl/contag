import type { User } from 'src/generated/graphql'
import updateGoalConstituents, {
  mutateUpdateGoalConstituents,
} from '../drivers/goal/updateConstituents'
import createGoal from '../drivers/goal/create'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('updateGoalConstituents', () => {
  describe('add', () => {
    it('adds one', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [] })
      const constituent = await createTask({ author, shareWith: [] })

      const updatedGoal = await updateGoalConstituents({
        itemId: goal.id,
        constituentsAdded: [{ id: constituent.id }],
        loggedInAs: author,
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          constituents: [
            {
              id: constituent.id,
            },
          ],
        })
      )
    })

    it("query doesn't return constituents which were not shared with the current user", async () => {
      const { clientAdminUser: firstUser, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const secondUser = clientMemberUsers[0] as User

      const goal = await createGoal({
        author: firstUser,
        shareWith: [secondUser],
      })
      const firstUserConstituent = await createGoal({
        author: firstUser,
        shareWith: [],
      })
      const secondUserConstituent = await createGoal({
        author: secondUser,
        shareWith: [],
      })

      await updateGoalConstituents({
        itemId: goal.id,
        constituentsAdded: [{ id: firstUserConstituent.id }],
        loggedInAs: firstUser,
      })

      const updatedGoal = await updateGoalConstituents({
        itemId: goal.id,
        constituentsAdded: [{ id: secondUserConstituent.id }],
        loggedInAs: secondUser,
      })

      expect(updatedGoal.constituents).toStrictEqual([
        { id: secondUserConstituent.id },
      ])
    })

    describe('errors', () => {
      it("returns not found when user has no access to the item they're trying to add as a constituent", async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User

        const goal = await createGoal({ author, shareWith: [otherUser] })
        const constituent = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateGoalConstituents({
          loggedInAs: otherUser,
          itemId: goal.id,
          constituentsAdded: [{ id: constituent.id }],
          constituentsRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Constituent(s) not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })

      it("returns not found when passed itemId doesn't reference a goal", async () => {
        const author = await createUser()

        const task = await createTask({ author, shareWith: [] })

        const response = await mutateUpdateGoalConstituents({
          loggedInAs: author,
          itemId: task.id,
          constituentsAdded: [],
          constituentsRemoved: [],
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })

      it('returns conflict when any of the passed constituents are already added', async () => {
        const author = await createUser()
        const goal = await createGoal({ author, shareWith: [] })
        const constituent = await createTask({ author, shareWith: [] })

        await updateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [{ id: constituent.id }],
          loggedInAs: author,
        })

        const response = await mutateUpdateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [{ id: constituent.id }],
          constituentsRemoved: [],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Constituent(s) already added',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })
    })
  })

  describe('remove', () => {
    const createGoalAndAddConstituent = async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [] })
      const constituent = await createGoal({ author, shareWith: [] })
      await updateGoalConstituents({
        itemId: goal.id,
        constituentsAdded: [{ id: constituent.id }],
        loggedInAs: author,
      })

      return { author, goal, constituent }
    }

    it('removes constituent', async () => {
      const { author, constituent, goal } = await createGoalAndAddConstituent()

      const updatedGoal = await updateGoalConstituents({
        itemId: goal.id,
        constituentsRemoved: [{ id: constituent.id }],
        loggedInAs: author,
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          constituents: [],
        })
      )
    })

    describe('errors', () => {
      it('cannot delete constituents from a goal that user has no access to', async () => {
        const { constituent, goal } = await createGoalAndAddConstituent()
        const anotherUser = await createUser()

        const response = await mutateUpdateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [],
          constituentsRemoved: [{ id: constituent.id }],
          loggedInAs: anotherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })

      it('cannot delete constituents from an item that is not a goal', async () => {
        const author = await createUser()
        const task = await createTask({ author, shareWith: [] })

        const response = await mutateUpdateGoalConstituents({
          itemId: task.id,
          constituentsAdded: [],
          constituentsRemoved: [{ id: 'Item:1' }],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Item not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })

      it('cannot delete a non-added constituent', async () => {
        const { goal, author } = await createGoalAndAddConstituent()
        const constituent = await createGoal({ author, shareWith: [] })

        const response = await mutateUpdateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [],
          constituentsRemoved: [{ id: constituent.id }],
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Constituent(s) not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })

      it('cannot delete constituent to which current user has no access', async () => {
        const { clientAdminUser, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User
        const goal = await createGoal({
          author: clientAdminUser,
          shareWith: [otherUser],
        })
        const constituent = await createGoal({
          author: clientAdminUser,
          shareWith: [],
        })

        await updateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [{ id: constituent.id }],
          loggedInAs: clientAdminUser,
        })

        const response = await mutateUpdateGoalConstituents({
          itemId: goal.id,
          constituentsAdded: [],
          constituentsRemoved: [{ id: constituent.id }],
          loggedInAs: otherUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            updateGoalConstituents: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Constituent(s) not found',
              path: ['updateGoalConstituents'],
            }),
          ],
        })
      })
    })
  })
})
