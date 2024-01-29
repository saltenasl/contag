import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import getItems, { queryItems } from '../drivers/items/get'
import sendMessage from '../drivers/message/send'
import acceptAnswer from '../drivers/question/acceptAnswer'
import createQuestion from '../drivers/question/create'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('question item type items', () => {
  it('returns questions shared with a user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const recipient = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const firstQuestion = await createQuestion({
      author,
      shareWith: [recipient],
    })
    const secondQuestion = await createQuestion({
      author,
      shareWith: [recipient],
    })
    await createQuestion({ author: thirdUser, shareWith: [author] })

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

    expect(body.errors).not.toBeDefined()
    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstQuestion),
      expect.objectContaining(secondQuestion),
    ])
  })

  it('returns questions user has created', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstQuestion = await createQuestion({
      author,
      shareWith: [recipient],
    })
    const secondQuestion = await createQuestion({
      author,
      shareWith: [recipient],
    })

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

    expect(body.errors).not.toBeDefined()
    expect(body.data.items).toStrictEqual(expect.any(Array))
    expect(body.data.items).toHaveLength(2)

    expect(body.data.items).toStrictEqual([
      expect.objectContaining(firstQuestion),
      expect.objectContaining(secondQuestion),
    ])
  })

  it('child count increases when nested questions are created', async () => {
    const author = await createUser()
    const parentQuestion = await createQuestion({
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
    expect(initialItems).toStrictEqual([parentQuestion])

    await createQuestion({
      author,
      parentId: parentQuestion.id,
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
        ...parentQuestion,
        childCount: 1,
      },
    ])
  })

  it('when parent item is a question - returns bool for "isAcceptedAnswer"', async () => {
    const author = await createUser()
    const parentQuestion = await createQuestion({
      author,
      shareWith: [],
    })

    await sendMessage({ author, parentId: parentQuestion.id })
    await createTask({ author, parentId: parentQuestion.id })
    await createQuestion({ author, parentId: parentQuestion.id })

    const items = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: { parentId: parentQuestion.id },
    })

    expect(items).toHaveLength(3)

    items.forEach((item) => {
      expect(item.isAcceptedAnswer).toStrictEqual(expect.any(Boolean))
    })
  })

  it('returns "isAcceptedAnswer" true for accepted answer item', async () => {
    const author = await createUser()
    const parentQuestion = await createQuestion({
      author,
      shareWith: [],
    })

    const message = await sendMessage({ author, parentId: parentQuestion.id })
    const task = await createTask({ author, parentId: parentQuestion.id })
    const question = await createQuestion({
      author,
      parentId: parentQuestion.id,
    })

    await acceptAnswer({ itemId: message.id, loggedInAs: author })

    const items = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: { parentId: parentQuestion.id },
    })

    expect(items).toHaveLength(3)
    expect(items).toStrictEqual([
      {
        ...message,
        isAcceptedAnswer: true,
      },
      {
        ...task,
        isAcceptedAnswer: false,
      },
      {
        ...question,
        isAcceptedAnswer: false,
      },
    ])
  })

  describe('filters', () => {
    describe('parentId', () => {
      const createQuestions = async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const recipient = clientMemberUsers[0] as User

        const parentQuestion = await createQuestion({
          author,
          shareWith: [recipient],
        })

        const nestedQuestion = await createQuestion({
          author,
          parentId: parentQuestion.id,
          shareWith: [recipient],
        })

        return { author, recipient, parentQuestion, nestedQuestion }
      }

      it('filters the items by parentId of type person', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const firstRecipient = clientMemberUsers[0] as User
        const secondRecipient = clientMemberUsers[1] as User

        const questionSharedWithFirstRecipient = await createQuestion({
          author,
          shareWith: [firstRecipient],
        })

        await createQuestion({
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

        expect(body.errors).not.toBeDefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining(questionSharedWithFirstRecipient),
        ])
      })

      it("returns only questions that don't have parentId when not passing a parentId filter", async () => {
        const { author, parentQuestion } = await createQuestions()

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

        expect(body.errors).not.toBeDefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining({ ...parentQuestion, childCount: 1 }),
        ])
      })

      it('returns questions for given parentId of type item', async () => {
        const { author, nestedQuestion, parentQuestion } =
          await createQuestions()

        const response = await queryItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
          filters: {
            parentId: parentQuestion.id,
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.errors).not.toBeDefined()
        expect(body.data.items).toStrictEqual(expect.any(Array))
        expect(body.data.items).toHaveLength(1)

        expect(body.data.items).toStrictEqual([
          expect.objectContaining({
            ...nestedQuestion,
            isAcceptedAnswer: false,
          }),
        ])
      })
    })
  })
})
