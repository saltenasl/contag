import { DAY_IN_MS } from 'src/constants'
import type { User } from 'src/generated/graphql'
import {
  ActionExpectationType,
  ItemsSortOrder,
  ItemsSortType,
} from 'src/generated/graphql'
import getItems from '../drivers/items/get'
import acceptAnswer from '../drivers/question/acceptAnswer'
import amendQuestion from '../drivers/question/amend'
import createQuestion from '../drivers/question/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'

describe('question action expectation', () => {
  it('sends a question with action required', async () => {
    const author = await createUser()
    const question = await createQuestion({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(question.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })
  })

  it('sends a question with action required with a deadline', async () => {
    const author = await createUser()

    const completeUntil = new Date(Date.now() + DAY_IN_MS)

    const question = await createQuestion({
      author,
      actionExpectation: { completeUntil },
      shareWith: [],
    })

    expect(question.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: completeUntil.toISOString(),
      fulfilled: false,
    })
  })

  it('sends a question with action required from a specific person that is not current user', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const otherUser = clientMemberUsers[0] as User
    const question = await createQuestion({
      author,
      to: [otherUser],
      actionExpectation: {},
      shareWith: [],
    })

    expect(question.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpected,
      completeUntil: null,
      fulfilled: false,
    })
  })

  describe('feed', () => {
    it('returns action required', async () => {
      const author = await createUser()
      const question = await createQuestion({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      const feed = await getItems({
        loggedInAs: author,
        filters: {},
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.NewestFirst,
        },
      })

      expect(feed).toStrictEqual([question])
    })
  })

  it('answer fulfills the action requirement', async () => {
    const author = await createUser()
    const question = await createQuestion({
      author,
      actionExpectation: {},
      shareWith: [],
    })

    expect(question.actionExpectation).toStrictEqual({
      type: ActionExpectationType.ActionExpectedFromYou,
      completeUntil: null,
      fulfilled: false,
    })

    const answer = await createQuestion({ author, parentId: question.id })
    await acceptAnswer({ itemId: answer.id, loggedInAs: author })

    const feed = await getItems({
      loggedInAs: author,
      filters: {},
      sort: {
        type: ItemsSortType.CreatedAt,
        order: ItemsSortOrder.NewestFirst,
      },
    })

    expect(feed).toStrictEqual([
      expect.objectContaining({
        actionExpectation: {
          type: ActionExpectationType.ActionExpectedFromYou,
          completeUntil: null,
          fulfilled: true,
        },
      }),
    ])
  })

  describe('amend', () => {
    it("doesn't remove action expected", async () => {
      const author = await createUser()
      const question = await createQuestion({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(question.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const updatedQuestion = await amendQuestion({
        id: question.id,
        author,
        actionExpectation: null,
      })

      expect(updatedQuestion).toStrictEqual({
        ...question,
        updatedAt: expect.any(String),
      })
    })

    it('removes completeUntil', async () => {
      const author = await createUser()
      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const question = await createQuestion({
        author,
        actionExpectation: { completeUntil },
        shareWith: [],
      })

      expect(question.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: completeUntil.toISOString(),
        fulfilled: false,
      })

      const updatedQuestion = await amendQuestion({
        id: question.id,
        author,
        actionExpectation: { completeUntil: null },
      })

      expect(updatedQuestion).toStrictEqual({
        ...question,
        updatedAt: expect.any(String),
        actionExpectation: {
          type: ActionExpectationType.ActionExpectedFromYou,
          completeUntil: null,
          fulfilled: false,
        },
      })
    })

    it('adds completeUntil', async () => {
      const author = await createUser()
      const question = await createQuestion({
        author,
        actionExpectation: {},
        shareWith: [],
      })

      expect(question.actionExpectation).toStrictEqual({
        type: ActionExpectationType.ActionExpectedFromYou,
        completeUntil: null,
        fulfilled: false,
      })

      const completeUntil = new Date(Date.now() + DAY_IN_MS)
      const updatedQuestion = await amendQuestion({
        id: question.id,
        author,
        actionExpectation: { completeUntil },
      })

      expect(updatedQuestion).toStrictEqual({
        ...question,
        updatedAt: expect.any(String),
        actionExpectation: {
          type: ActionExpectationType.ActionExpectedFromYou,
          completeUntil: completeUntil.toISOString(),
          fulfilled: false,
        },
      })
    })
  })
})
