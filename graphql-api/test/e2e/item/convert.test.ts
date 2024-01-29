import { TypeName } from 'src/constants'
import { ItemType, TaskStatus } from 'src/generated/graphql'
import createGoal from '../drivers/goal/create'
import createInfo from '../drivers/info/create'
import convertItem, { mutateConvertItem } from '../drivers/item/convert'
import createItem, { getItemTypeName } from '../drivers/item/create'
import sendMessage from '../drivers/message/send'
import createQuestion from '../drivers/question/create'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'

describe('convertItem mutation', () => {
  describe('task', () => {
    it('converts message to a task', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: message.id,
          to: ItemType.Task,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: message.id,
            __typename: TypeName.TASK,
            text: message.text,
            richText: message.richText,
          }),
        },
      })
    })

    it('converts question to a task', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: question.id,
          to: ItemType.Task,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.TASK,
            text: question.text,
            richText: question.richText,
            status: TaskStatus.Todo,
          }),
        },
      })
    })

    it('converts info to a task', async () => {
      const author = await createUser()
      const info = await createInfo({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: info.id,
          to: ItemType.Task,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.TASK,
            text: info.text,
            richText: info.richText,
            status: TaskStatus.Todo,
          }),
        },
      })
    })

    it('converts goal to a task', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: goal.id,
          to: ItemType.Task,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.TASK,
            text: goal.text,
            richText: goal.richText,
            status: TaskStatus.Todo,
          }),
        },
      })
    })
  })

  describe('message', () => {
    it('converts task to a message', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Message,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: task.id,
            __typename: TypeName.MESSAGE,
            text: task.text,
            richText: task.richText,
          }),
        },
      })
    })

    it('converts goal to a message', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: goal.id,
          to: ItemType.Message,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: goal.id,
            __typename: TypeName.MESSAGE,
            text: goal.text,
            richText: goal.richText,
          }),
        },
      })
    })

    it('converts question to a message', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: question.id,
          to: ItemType.Message,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: question.id,
            __typename: TypeName.MESSAGE,
            text: question.text,
            richText: question.richText,
          }),
        },
      })
    })

    it('converts info to a message', async () => {
      const author = await createUser()
      const info = await createInfo({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: info.id,
          to: ItemType.Message,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: info.id,
            __typename: TypeName.MESSAGE,
            text: info.text,
            richText: info.richText,
          }),
        },
      })
    })
  })

  describe('question', () => {
    it('converts message to a question', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: message.id,
          to: ItemType.Question,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: message.id,
            __typename: TypeName.QUESTION,
            text: message.text,
            richText: message.richText,
            acceptedAnswer: null,
          }),
        },
      })
    })

    it('converts task to a question', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Question,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.QUESTION,
            text: task.text,
            richText: task.richText,
            acceptedAnswer: null,
          }),
        },
      })
    })

    it('converts goal to a question', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: goal.id,
          to: ItemType.Question,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.QUESTION,
            text: goal.text,
            richText: goal.richText,
            acceptedAnswer: null,
          }),
        },
      })
    })

    it('converts info to a question', async () => {
      const author = await createUser()
      const info = await createInfo({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: info.id,
          to: ItemType.Question,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.QUESTION,
            acceptedAnswer: null,
            text: info.text,
            richText: info.richText,
          }),
        },
      })
    })
  })

  describe('info', () => {
    it('converts message to info', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: message.id,
          to: ItemType.Info,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: message.id,
            __typename: TypeName.INFO,
            text: message.text,
            richText: message.richText,
            acknowledged: false,
          }),
        },
      })
    })

    it('converts question to info', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: question.id,
          to: ItemType.Info,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.INFO,
            text: question.text,
            richText: question.richText,
            acknowledged: false,
          }),
        },
      })
    })

    it('converts task to info', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Info,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.INFO,
            text: task.text,
            richText: task.richText,
            acknowledged: false,
          }),
        },
      })
    })

    it('converts goal to info', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: goal.id,
          to: ItemType.Info,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.INFO,
            text: goal.text,
            richText: goal.richText,
            acknowledged: false,
          }),
        },
      })
    })
  })

  describe('goal', () => {
    it('converts message to goal', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: message.id,
          to: ItemType.Goal,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            id: message.id,
            __typename: TypeName.GOAL,
            text: message.text,
            richText: message.richText,
          }),
        },
      })
    })

    it('converts question to goal', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: question.id,
          to: ItemType.Goal,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.GOAL,
            text: question.text,
            richText: question.richText,
          }),
        },
      })
    })

    it('converts task to goal', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Goal,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.GOAL,
            text: task.text,
            richText: task.richText,
          }),
        },
      })
    })

    it('converts info to goal', async () => {
      const author = await createUser()
      const info = await createInfo({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: info.id,
          to: ItemType.Goal,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: expect.objectContaining({
            __typename: TypeName.GOAL,
            text: info.text,
            richText: info.richText,
          }),
        },
      })
    })
  })

  it.each([
    ItemType.Task,
    ItemType.Message,
    ItemType.Question,
    ItemType.Info,
    ItemType.Goal,
  ])('just returns self when converting from and to %s', async (type) => {
    const author = await createUser()
    const item = await createItem(type, { author })

    const updatedItem = await convertItem({
      input: {
        itemId: item.id,
        to: type,
      },
      loggedInAs: author,
    })

    expect(updatedItem).toStrictEqual({
      __typename: getItemTypeName(type),
      ...item,
    })
  })

  describe('errors', () => {
    it('user that is not in sharedWith cannot convert', async () => {
      const author = await createUser()
      const anotherUser = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Message,
        },
        loggedInAs: anotherUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Unauthorized',
            path: ['convertItem'],
          }),
        ],
      })
    })

    it('returns unauthorized when item is not found', async () => {
      const author = await createUser()
      const anotherUser = await createUser()
      const task = await createTask({ author, shareWith: [author] })

      const response = await mutateConvertItem({
        input: {
          itemId: task.id,
          to: ItemType.Message,
        },
        loggedInAs: anotherUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          convertItem: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Unauthorized',
            path: ['convertItem'],
          }),
        ],
      })
    })
  })
})
