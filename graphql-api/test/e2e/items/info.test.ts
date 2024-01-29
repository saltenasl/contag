import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems, { queryItems } from '../drivers/items/get'
import createInfo from '../drivers/info/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('info item type items', () => {
  it('returns only infos shared with a user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const recipient = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const firstInfo = await createInfo({ author, shareWith: [recipient] })
    const secondInfo = await createInfo({ author, shareWith: [recipient] })
    await createInfo({ author: thirdUser, shareWith: [author] })

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

    expect(body.errors).toBeUndefined()
    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstInfo),
      expect.objectContaining(secondInfo),
    ])
  })

  it('returns infos user has created', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstInfo = await createInfo({ author, shareWith: [recipient] })
    const secondInfo = await createInfo({ author, shareWith: [recipient] })

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

    expect(body.errors).toBeUndefined()
    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstInfo),
      expect.objectContaining(secondInfo),
    ])
  })

  it('child count increases when nested infos are created', async () => {
    const author = await createUser()
    const parentInfo = await createInfo({
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
    expect(initialItems).toStrictEqual([parentInfo])

    await createInfo({
      author,
      parentId: parentInfo.id,
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
        ...parentInfo,
        childCount: 1,
      },
    ])
  })

  describe('filters', () => {
    describe('parentId', () => {
      const createInfos = async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const recipient = clientMemberUsers[0] as User

        const parentInfo = await createInfo({
          author,
          shareWith: [recipient],
        })

        const nestedInfo = await createInfo({
          author,
          parentId: parentInfo.id,
          shareWith: [recipient],
        })

        return { author, recipient, parentInfo, nestedInfo }
      }

      it('filters the items by parentId of type person', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const firstRecipient = clientMemberUsers[0] as User
        const secondRecipient = clientMemberUsers[1] as User

        const infoSharedWithFirstRecipient = await createInfo({
          author,
          shareWith: [firstRecipient],
        })

        await createInfo({
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

        expect(body.errors).toBeUndefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(infoSharedWithFirstRecipient),
        ])
      })

      it("returns only infos that don't have parentId when not passing a parentId filter", async () => {
        const { author, parentInfo } = await createInfos()

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

        expect(body.errors).toBeUndefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining({ ...parentInfo, childCount: 1 }),
        ])
      })

      it('returns infos for given parentId of type item', async () => {
        const { author, nestedInfo, parentInfo } = await createInfos()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: parentInfo.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.errors).toBeUndefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(nestedInfo),
        ])
      })
    })
  })
})
