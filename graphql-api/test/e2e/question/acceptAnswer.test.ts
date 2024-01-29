import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import { ItemType } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import getItems from '../drivers/items/get'
import createInfo from '../drivers/info/create'
import convertItem from '../drivers/item/convert'
import nestItem from '../drivers/item/nest'
import sendMessage from '../drivers/message/send'
import acceptAnswer, {
  mutateAcceptAnswer,
} from '../drivers/question/acceptAnswer'
import createQuestion from '../drivers/question/create'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('acceptAnswer', () => {
  it('accepts message as an answer to a question', async () => {
    const author = await createUser()
    const question = await createQuestion({ author, shareWith: [] })
    const message = await sendMessage({ author, parentId: question.id })

    const response = await mutateAcceptAnswer({
      itemId: message.id,
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.errors).not.toBeDefined()
    expect(body).toStrictEqual({
      data: {
        acceptAnswer: {
          ...message,
          isAcceptedAnswer: true,
        },
      },
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.NewestFirst,
      },
      filters: {},
    })

    expect(feed).toStrictEqual([
      expect.objectContaining({
        id: question.id,
        acceptedAnswer: { text: message.text, richText: message.richText },
      }),
    ])
  })

  it('accepts task as an answer to a question', async () => {
    const author = await createUser()
    const question = await createQuestion({ author, shareWith: [] })
    const task = await createTask({ author, parentId: question.id })

    const response = await mutateAcceptAnswer({
      itemId: task.id,
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.errors).not.toBeDefined()
    expect(body).toStrictEqual({
      data: {
        acceptAnswer: {
          ...task,
          isAcceptedAnswer: true,
        },
      },
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.NewestFirst,
      },
      filters: {},
    })

    expect(feed).toStrictEqual([
      expect.objectContaining({
        id: question.id,
        acceptedAnswer: {
          text: task.text,
          richText: task.richText,
        },
      }),
    ])
  })

  it('accepts question as an answer to a question', async () => {
    const author = await createUser()
    const question = await createQuestion({ author, shareWith: [] })
    const questionAsAnswer = await createQuestion({
      author,
      parentId: question.id,
    })

    const response = await mutateAcceptAnswer({
      itemId: questionAsAnswer.id,
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.errors).not.toBeDefined()
    expect(body).toStrictEqual({
      data: {
        acceptAnswer: {
          ...questionAsAnswer,
          isAcceptedAnswer: true,
        },
      },
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.NewestFirst,
      },
      filters: {},
    })

    expect(feed).toStrictEqual([
      expect.objectContaining({
        id: question.id,
        acceptedAnswer: {
          text: questionAsAnswer.text,
          richText: questionAsAnswer.richText,
        },
      }),
    ])
  })

  it('accepts info as an answer to a question', async () => {
    const author = await createUser()
    const question = await createQuestion({ author, shareWith: [] })
    const info = await createInfo({
      author,
      parentId: question.id,
    })

    const response = await mutateAcceptAnswer({
      itemId: info.id,
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.errors).not.toBeDefined()
    expect(body).toStrictEqual({
      data: {
        acceptAnswer: {
          ...info,
          isAcceptedAnswer: true,
        },
      },
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.NewestFirst,
      },
      filters: {},
    })

    expect(feed).toStrictEqual([
      expect.objectContaining({
        id: question.id,
        acceptedAnswer: { text: info.text, richText: info.richText },
      }),
    ])
  })

  it('allows accepting another answer', async () => {
    const author = await createUser()
    const parent = await createQuestion({ author, shareWith: [] })
    const answerMessage = await sendMessage({ author, parentId: parent.id })
    const message = await sendMessage({ author, parentId: parent.id })

    await acceptAnswer({ itemId: answerMessage.id, loggedInAs: author })

    const acceptedAnswer = await acceptAnswer({
      itemId: message.id,
      loggedInAs: author,
    })

    expect(acceptedAnswer).toStrictEqual({
      ...message,
      isAcceptedAnswer: true,
    })

    const feed = await getItems({
      loggedInAs: author,
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.OldestFirst,
      },
      filters: {
        parentId: parent.id,
      },
    })

    expect(feed).toStrictEqual([
      {
        ...answerMessage,
        isAcceptedAnswer: false,
      },
      acceptedAnswer,
    ])
  })

  describe('nestItem', () => {
    it('when answer is nested under another parent question is no longer marked as answered', async () => {
      const author = await createUser()
      const toBeParentMessage = await sendMessage({ author, shareWith: [] })
      const question = await createQuestion({ author, shareWith: [] })
      const answer = await createQuestion({
        author,
        parentId: question.id,
      })

      await acceptAnswer({
        itemId: answer.id,
        loggedInAs: author,
      })

      await nestItem({
        input: { itemId: answer.id, newParentId: toBeParentMessage.id },
        loggedInAs: author,
      })

      const feed = await getItems({
        loggedInAs: author,
        filters: {},
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.NewestFirst,
        },
      })

      expect(feed).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: question.id,
            acceptedAnswer: null,
          }),
        ])
      )
    })

    it('when answer is re-ordered under same parent answer is not removed', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [] })
      const answer = await createQuestion({
        author,
        parentId: question.id,
      })

      await acceptAnswer({
        itemId: answer.id,
        loggedInAs: author,
      })

      await nestItem({
        input: { itemId: answer.id, newParentId: question.id }, // same parent id as before
        loggedInAs: author,
      })

      const feed = await getItems({
        loggedInAs: author,
        filters: {},
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.NewestFirst,
        },
      })

      expect(feed).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: question.id,
            acceptedAnswer: { text: answer.text, richText: answer.richText },
          }),
        ])
      )
    })
  })

  describe('convertItem', () => {
    it.each([ItemType.Message, ItemType.Task])(
      'children are no longer potential answers when question is converted to %s',
      async (convertToItemType) => {
        const author = await createUser()
        const question = await createQuestion({ author, shareWith: [] })
        const answer = await createQuestion({
          author,
          shareWith: [],
          parentId: question.id,
        })

        const acceptedAnswer = await acceptAnswer({
          itemId: answer.id,
          loggedInAs: author,
        })
        expect(acceptedAnswer.isAcceptedAnswer).toBe(true)

        await convertItem({
          input: { itemId: question.id, to: convertToItemType },
          loggedInAs: author,
        })

        const feed = await getItems({
          filters: { parentId: question.id },
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          loggedInAs: author,
        })

        expect(feed).toStrictEqual([
          expect.objectContaining({
            id: answer.id,
            isAcceptedAnswer: null,
          }),
        ])
      }
    )
  })

  describe('errors', () => {
    it("returns not found when item doesn't exist", async () => {
      const response = await mutateAcceptAnswer({
        itemId: idFromPrismaToGraphQL(-1, TypeName.ITEM),
        loggedInAs: await createUser(),
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptAnswer: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['acceptAnswer'],
          }),
        ],
      })
    })

    it('returns conflict when parent is not a question', async () => {
      const author = await createUser()
      const parent = await sendMessage({ author, shareWith: [] })
      const message = await sendMessage({ author, parentId: parent.id })

      const response = await mutateAcceptAnswer({
        itemId: message.id,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptAnswer: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Conflict',
            path: ['acceptAnswer'],
          }),
        ],
      })
    })

    it('returns conflict when no parent is set', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })

      const response = await mutateAcceptAnswer({
        itemId: message.id,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptAnswer: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Conflict',
            path: ['acceptAnswer'],
          }),
        ],
      })
    })

    it('returns item not found when user is not in items sharedWith', async () => {
      const user = await createUser()
      const message = await sendMessage({
        author: await createUser(),
        shareWith: [],
      })

      const response = await mutateAcceptAnswer({
        itemId: message.id,
        loggedInAs: user,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptAnswer: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['acceptAnswer'],
          }),
        ],
      })
    })

    it('returns conflict when user is not in parents sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const userAcceptingAnswer = clientMemberUsers[0] as User

      const question = await createQuestion({
        author,
        shareWith: [],
      })
      const message = await sendMessage({
        author,
        parentId: question.id,
        shareWith: [userAcceptingAnswer],
      })

      const response = await mutateAcceptAnswer({
        itemId: message.id,
        loggedInAs: userAcceptingAnswer,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptAnswer: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Conflict',
            path: ['acceptAnswer'],
          }),
        ],
      })
    })
  })
})
