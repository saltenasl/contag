import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import { ItemsSortOrder, ItemsSortType, ItemType } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import getItems from '../drivers/items/get'
import createItem from '../drivers/item/create'
import { mutateDeleteItemSummary } from '../drivers/item/deleteSummary'
import summarizeItem, { mutateSummarizeItem } from '../drivers/item/summarize'
import sendMessage from '../drivers/message/send'
import acceptAnswer from '../drivers/question/acceptAnswer'
import createQuestion from '../drivers/question/create'
import createUser from '../drivers/user/create'

describe('summarizeItem mutation', () => {
  it.each`
    type                 | shouldReplaceOriginalItem
    ${ItemType.Message}  | ${true}
    ${ItemType.Message}  | ${false}
    ${ItemType.Question} | ${true}
    ${ItemType.Question} | ${false}
    ${ItemType.Task}     | ${true}
    ${ItemType.Task}     | ${false}
    ${ItemType.Info}     | ${true}
    ${ItemType.Info}     | ${false}
    ${ItemType.Goal}     | ${true}
    ${ItemType.Goal}     | ${false}
  `(
    'summarizes $type with shouldReplaceOriginalItem = $shouldReplaceOriginalItem',
    async ({ type, shouldReplaceOriginalItem }) => {
      const author = await createUser()
      const item = await createItem(type, { author })
      const text = faker.lorem.paragraph()
      const richText = JSON.parse(faker.datatype.json())

      const response = await mutateSummarizeItem({
        itemId: item.id,
        text,
        richText,
        shouldReplaceOriginalItem,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      const summarizedItem = {
        ...item,
        summary: {
          text,
          richText,
          shouldReplaceOriginalItem,
        },
      }

      expect(body).toStrictEqual({
        data: {
          summarizeItem: summarizedItem,
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

      expect(feed).toStrictEqual([summarizedItem])
    }
  )

  describe('shouldReplaceOriginalItem', () => {
    it('when set to true - returns summary of the answer instead of items text as questions answer', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [] })
      const answer = await sendMessage({ author, parentId: question.id })

      await acceptAnswer({ itemId: answer.id, loggedInAs: author })

      const text = faker.lorem.paragraph()
      await summarizeItem({
        itemId: answer.id,
        text,
        shouldReplaceOriginalItem: true,
        loggedInAs: author,
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
          acceptedAnswer: { text, richText: null },
        }),
      ])
    })

    it("when set to false - doesn't return summary of the answer instead of items text as questions answer", async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [] })
      const answer = await sendMessage({ author, parentId: question.id })

      await acceptAnswer({ itemId: answer.id, loggedInAs: author })

      const text = faker.lorem.paragraph()
      await summarizeItem({
        itemId: answer.id,
        text,
        shouldReplaceOriginalItem: false,
        loggedInAs: author,
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
          acceptedAnswer: { text: answer.text, richText: answer.richText },
        }),
      ])
    })
  })

  describe('errors', () => {
    it('returns not found when item id is non existent', async () => {
      const author = await createUser()

      const response = await mutateSummarizeItem({
        itemId: idFromPrismaToGraphQL(-1, TypeName.ITEM),
        text: '',
        shouldReplaceOriginalItem: false,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { summarizeItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['summarizeItem'],
          }),
        ],
      })
    })

    it('returns not found when person who is summarizing is not in shareWith', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })

      const stranger = await createUser()

      const response = await mutateSummarizeItem({
        itemId: message.id,
        text: '',
        shouldReplaceOriginalItem: false,
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { summarizeItem: null },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['summarizeItem'],
          }),
        ],
      })
    })
  })
})

describe('deleteItemSummary mutation', () => {
  it.each([ItemType.Message, ItemType.Question, ItemType.Task])(
    'deletes %s summary',
    async (itemType) => {
      const author = await createUser()
      const item = await createItem(itemType, { author })

      const summarizedItem = await summarizeItem({
        itemId: item.id,
        loggedInAs: author,
      })
      expect(summarizedItem.summary).toStrictEqual(expect.any(Object))

      const response = await mutateDeleteItemSummary({
        itemId: item.id,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          deleteItemSummary: expect.objectContaining({
            id: item.id,
            summary: null,
          }),
        },
      })
    }
  )

  it.each([ItemType.Message, ItemType.Question, ItemType.Task])(
    'just returns %s when summary is null already',
    async (itemType) => {
      const author = await createUser()
      const item = await createItem(itemType, { author })

      expect(item.summary).toBe(null)

      const response = await mutateDeleteItemSummary({
        itemId: item.id,
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          deleteItemSummary: expect.objectContaining({
            id: item.id,
            summary: null,
          }),
        },
      })
    }
  )

  describe('errors', () => {
    it('returns not found when non-existent item id is passed', async () => {
      const response = await mutateDeleteItemSummary({
        itemId: idFromPrismaToGraphQL(-1, TypeName.MESSAGE),
        loggedInAs: await createUser(),
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          deleteItemSummary: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['deleteItemSummary'],
          }),
        ],
      })
    })

    it('returns not found when user is not in items sharedWith', async () => {
      const author = await createUser()
      const item = await sendMessage({ author, shareWith: [] })
      const stranger = await createUser()

      const response = await mutateDeleteItemSummary({
        itemId: item.id,
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          deleteItemSummary: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['deleteItemSummary'],
          }),
        ],
      })
    })
  })
})
