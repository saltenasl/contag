import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems, { queryItems } from '../drivers/items/get'
import createGoal from '../drivers/goal/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('goal item type items query', () => {
  it('returns goals shared with a user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const recipient = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const firstGoal = await createGoal({ author, shareWith: [recipient] })
    const secondGoal = await createGoal({ author, shareWith: [recipient] })
    await createGoal({ author: thirdUser, shareWith: [author] })

    const response = await queryItems({
      loggedInAs: recipient,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: {},
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstGoal),
      expect.objectContaining(secondGoal),
    ])
  })

  it('returns goals user has created', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstGoal = await createGoal({ author, shareWith: [recipient] })
    const secondGoal = await createGoal({ author, shareWith: [recipient] })

    const response = await queryItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: {},
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstGoal),
      expect.objectContaining(secondGoal),
    ])
  })

  it('child count increases when nested goals are created', async () => {
    const author = await createUser()
    const parentGoal = await createGoal({
      author,
      shareWith: [],
    })

    const initialItems = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: {},
    })
    expect(initialItems).toStrictEqual([parentGoal])

    await createGoal({
      author,
      parentId: parentGoal.id,
      shareWith: [],
    })

    const updatedItems = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: {},
    })
    expect(updatedItems).toStrictEqual([
      {
        ...parentGoal,
        childCount: 1,
      },
    ])
  })

  describe('filters', () => {
    describe('parentId', () => {
      const createGoals = async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const recipient = clientMemberUsers[0] as User

        const parentGoal = await createGoal({
          author,
          shareWith: [recipient],
        })

        const nestedGoal = await createGoal({
          author,
          parentId: parentGoal.id,
          shareWith: [recipient],
        })

        return { author, recipient, parentGoal, nestedGoal }
      }

      it('filters the items by parentId of type person', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const firstRecipient = clientMemberUsers[0] as User
        const secondRecipient = clientMemberUsers[1] as User

        const goalSharedWithFirstRecipient = await createGoal({
          author,
          shareWith: [firstRecipient],
        })

        await createGoal({
          author,
          shareWith: [secondRecipient],
        })

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: firstRecipient.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(goalSharedWithFirstRecipient),
        ])
      })

      it("returns only goals that don't have parentId when not passing a parentId filter", async () => {
        const { author, parentGoal } = await createGoals()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {},
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining({ ...parentGoal, childCount: 1 }),
        ])
      })

      it('returns goals for given parentId of type item', async () => {
        const { author, nestedGoal, parentGoal } = await createGoals()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: parentGoal.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(nestedGoal),
        ])
      })
    })
  })
})
