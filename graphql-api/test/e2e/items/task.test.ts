import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems, { queryItems } from '../drivers/items/get'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('task item type items', () => {
  it('returns tasks shared with a user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const recipient = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const firstTask = await createTask({ author, shareWith: [recipient] })
    const secondTask = await createTask({ author, shareWith: [recipient] })
    await createTask({ author: thirdUser, shareWith: [author] })

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
      expect.objectContaining(firstTask),
      expect.objectContaining(secondTask),
    ])
  })

  it('returns tasks user has created', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstTask = await createTask({ author, shareWith: [recipient] })
    const secondTask = await createTask({ author, shareWith: [recipient] })

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
      expect.objectContaining(firstTask),
      expect.objectContaining(secondTask),
    ])
  })

  it('child count increases when nested tasks are created', async () => {
    const author = await createUser()
    const parentTask = await createTask({
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
    expect(initialItems).toStrictEqual([parentTask])

    await createTask({
      author,
      parentId: parentTask.id,
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
        ...parentTask,
        childCount: 1,
      },
    ])
  })

  describe('filters', () => {
    describe('parentId', () => {
      const createTasks = async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const recipient = clientMemberUsers[0] as User

        const parentTask = await createTask({
          author,
          shareWith: [recipient],
        })

        const nestedTask = await createTask({
          author,
          parentId: parentTask.id,
          shareWith: [recipient],
        })

        return { author, recipient, parentTask, nestedTask }
      }

      it('filters the items by parentId of type person', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const firstRecipient = clientMemberUsers[0] as User
        const secondRecipient = clientMemberUsers[1] as User

        const taskSharedWithFirstRecipient = await createTask({
          author,
          shareWith: [firstRecipient],
        })

        await createTask({
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
          expect.objectContaining(taskSharedWithFirstRecipient),
        ])
      })

      it("returns only tasks that don't have parentId when not passing a parentId filter", async () => {
        const { author, parentTask } = await createTasks()

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
          expect.objectContaining({ ...parentTask, childCount: 1 }),
        ])
      })

      it('returns tasks for given parentId of type item', async () => {
        const { author, nestedTask, parentTask } = await createTasks()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: parentTask.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(nestedTask),
        ])
      })
    })
  })
})
