import createUser from '../drivers/user/create'
import sendMessage from '../drivers/message/send'
import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems, { queryItems } from '../drivers/items/get'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('message type items', () => {
  it('returns messages addressed to a user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const recipient = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const firstMessage = await sendMessage({ author, shareWith: [recipient] })
    const secondMessage = await sendMessage({ author, shareWith: [recipient] })
    await sendMessage({ author: thirdUser, shareWith: [author] })

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
      expect.objectContaining(firstMessage),
      expect.objectContaining(secondMessage),
    ])
  })

  it('returns messages user has sent', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstMessage = await sendMessage({ author, shareWith: [recipient] })
    const secondMessage = await sendMessage({ author, shareWith: [recipient] })

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
      expect.objectContaining(firstMessage),
      expect.objectContaining(secondMessage),
    ])
  })

  it('child count increases when nested tasks are created', async () => {
    const author = await createUser()
    const parentMessage = await sendMessage({
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
    expect(initialItems).toStrictEqual([parentMessage])

    await sendMessage({
      author,
      parentId: parentMessage.id,
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
        ...parentMessage,
        childCount: 1,
      },
    ])
  })

  describe('filters', () => {
    describe('parentId', () => {
      const sendMessages = async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const recipient = clientMemberUsers[0] as User

        const parentMessage = await sendMessage({
          author,
          shareWith: [recipient],
        })

        const nestedMessage = await sendMessage({
          author,
          parentId: parentMessage.id,
          shareWith: [recipient],
        })

        return { author, recipient, parentMessage, nestedMessage }
      }

      it('filters the items by parentId of type person', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const firstRecipient = clientMemberUsers[0] as User
        const secondRecipient = clientMemberUsers[1] as User

        const messageToFirstRecipient = await sendMessage({
          author,
          shareWith: [firstRecipient],
        })

        await sendMessage({
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
          expect.objectContaining(messageToFirstRecipient),
        ])
      })

      it("returns only messages that don't have parentId when not passing a parentId filter", async () => {
        const { author, parentMessage } = await sendMessages()

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
          expect.objectContaining({
            ...parentMessage,
            childCount: 1,
          }),
        ])
      })

      it('returns messages for given parentId of type item', async () => {
        const { author, nestedMessage, parentMessage } = await sendMessages()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: parentMessage.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(nestedMessage),
        ])
      })
    })
  })
})
