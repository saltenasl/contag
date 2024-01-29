import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import getItems from '../drivers/items/get'
import nestItem, { mutateNestItem } from '../drivers/item/nest'
import sendMessage from '../drivers/message/send'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('nest item mutation', () => {
  it('nests a message under another message', async () => {
    const author = await createUser()

    const parentMessage = await sendMessage({ author, shareWith: [] })
    const toBeNestedMessage = await sendMessage({ author, shareWith: [] })

    const response = await mutateNestItem({
      input: { itemId: toBeNestedMessage.id, newParentId: parentMessage.id },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        nestItem: expect.objectContaining({
          success: true,
        }),
      },
    })
  })

  it('is able to retrieve the newly nested message in parent messages feed', async () => {
    const author = await createUser()

    const parentMessage = await sendMessage({ author, shareWith: [] })
    const toBeNestedMessage = await sendMessage({ author, shareWith: [] })

    await nestItem({
      input: { itemId: toBeNestedMessage.id, newParentId: parentMessage.id },
      loggedInAs: author,
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: { parentId: parentMessage.id },
    })

    expect(feed).toStrictEqual([
      {
        ...toBeNestedMessage,
        parentId: parentMessage.id,
      },
    ])
  })

  it('allows parentId pointing to a user and treats it as null', async () => {
    const author = await createUser()

    const parentMessage = await sendMessage({ author, shareWith: [] })
    const nestedMessage = await sendMessage({
      author,
      shareWith: [author],
      parentId: parentMessage.id,
    })

    const response = await mutateNestItem({
      input: { itemId: nestedMessage.id, newParentId: author.id },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        nestItem: expect.objectContaining({
          success: true,
        }),
      },
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: { parentId: null },
    })

    expect(feed).toStrictEqual(
      expect.arrayContaining([
        {
          ...nestedMessage,
          parentId: null,
        },
        parentMessage,
      ])
    )
  })

  describe('errors', () => {
    it('item not found', async () => {
      const author = await createUser()
      const parentMessage = await sendMessage({ author, shareWith: [] })

      const response = await mutateNestItem({
        input: {
          itemId: idFromPrismaToGraphQL(-1, TypeName.ITEM),
          newParentId: parentMessage.id,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { nestItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item or new parent not found',
            path: ['nestItem'],
          }),
        ],
      })
    })

    it('new parent not found', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })

      const response = await mutateNestItem({
        input: {
          itemId: message.id,
          newParentId: idFromPrismaToGraphQL(-1, TypeName.ITEM),
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { nestItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item or new parent not found',
            path: ['nestItem'],
          }),
        ],
      })
    })

    it('new parent not found when its not of type ITEM', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })

      const response = await mutateNestItem({
        input: {
          itemId: message.id,
          newParentId: idFromPrismaToGraphQL(1, TypeName.CLIENT),
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { nestItem: null },
        errors: [
          expect.objectContaining({
            message: 'Invalid parent id',
            path: ['nestItem'],
          }),
        ],
      })
    })

    it('cannot nest item under a new parent if user is not in the items sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const stranger = clientMemberUsers[0] as User

      const parentMessage = await sendMessage({
        author,
        shareWith: [stranger],
      })
      const toBeNestedMessage = await sendMessage({
        author,
        shareWith: [],
      })

      const response = await mutateNestItem({
        input: {
          itemId: toBeNestedMessage.id,
          newParentId: parentMessage.id,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { nestItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item or new parent not found',
            path: ['nestItem'],
          }),
        ],
      })
    })

    it('cannot nest item under a new parent if user is not in the parents sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const stranger = clientMemberUsers[0] as User

      const parentMessage = await sendMessage({ author, shareWith: [] })
      const toBeNestedMessage = await sendMessage({
        author,
        shareWith: [stranger],
      })

      const response = await mutateNestItem({
        input: {
          itemId: toBeNestedMessage.id,
          newParentId: parentMessage.id,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { nestItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item or new parent not found',
            path: ['nestItem'],
          }),
        ],
      })
    })

    it('cannot nest item under itself', async () => {
      const author = await createUser()
      const item = await sendMessage({ author, shareWith: [] })

      const response = await mutateNestItem({
        input: { itemId: item.id, newParentId: item.id },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          nestItem: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Cannot nest item under itself',
            path: ['nestItem'],
          }),
        ],
      })
    })
  })
})
