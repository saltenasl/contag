import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import { TaskStatus } from 'src/generated/graphql'
import amendMessage from '../drivers/message/amend'
import sendMessage from '../drivers/message/send'
import amendQuestion from '../drivers/question/amend'
import createQuestion, {
  mutateCreateQuestion,
} from '../drivers/question/create'
import amendTask from '../drivers/task/amend'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'

describe('nesting', () => {
  it('creates a question with a parent', async () => {
    const author = await createUser()

    const firstQuestion = await createQuestion({
      author,
      shareWith: [],
    })

    const nestedQuestion = await createQuestion({
      author,
      shareWith: [],
      parentId: firstQuestion.id,
    })

    expect(nestedQuestion).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining([userToPublicUser(author)]),
        parentId: firstQuestion.id,
      })
    )
    expect(nestedQuestion.sharedWith).toHaveLength(1)
  })

  it('takes sharedWith from the parent when not provided', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstQuestion = await createQuestion({
      author,
      shareWith: [recipient],
    })

    const nestedQuestion = await createQuestion({
      author,
      parentId: firstQuestion.id,
    })

    expect(nestedQuestion).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining(firstQuestion.sharedWith),
        parentId: firstQuestion.id,
      })
    )
    expect(nestedQuestion.sharedWith.length).toBe(
      firstQuestion.sharedWith.length
    )
  })

  it('all item types have "isAcceptedAnswer" as bool when they are nested under a question', async () => {
    const author = await createUser()
    const parentQuestion = await createQuestion({
      author,
      shareWith: [],
    })

    const message = await sendMessage({
      author,
      shareWith: [],
      parentId: parentQuestion.id,
    })
    expect(message.isAcceptedAnswer).toBe(false)
    const updatedMessage = await amendMessage({
      loggedInAs: author,
      id: message.id,
    })
    expect(updatedMessage.isAcceptedAnswer).toBe(false)

    const task = await createTask({
      author,
      shareWith: [],
      parentId: parentQuestion.id,
    })
    expect(task.isAcceptedAnswer).toBe(false)
    const updatedTask = await amendTask({
      author,
      id: task.id,
      status: TaskStatus.Done,
    })
    expect(updatedTask.isAcceptedAnswer).toBe(false)

    const question = await createQuestion({
      author,
      shareWith: [],
      parentId: parentQuestion.id,
    })
    expect(question.isAcceptedAnswer).toBe(false)
    const updatedQuestion = await amendQuestion({
      author,
      id: question.id,
    })
    expect(updatedQuestion.isAcceptedAnswer).toBe(false)
  })

  describe('errors', () => {
    it('throws an error when non item id is passed as parentId', async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateQuestion({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [{ id: recipient.id }],
          parentId: recipient.id,
          actionExpectation: {},
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          createQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Invalid parentId entity type "User"',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it('throws when neither "parentId", "shareWith", nor "to" is passed', async () => {
      const author = await createUser()

      const response = await mutateCreateQuestion({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          actionExpectation: {},
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          createQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Must provide one of "parentId", "shareWith" or "to"',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it('throws when "parentId" is non existent', async () => {
      const author = await createUser()

      const response = await mutateCreateQuestion({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          parentId: `${TypeName.ITEM}:-1`,
          actionExpectation: {},
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          createQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it('barred from creation when user is not in the parent items sharedWith', async () => {
      const firstUser = await createUser()
      const secondUser = await createUser()

      const parentMessage = await createQuestion({
        author: firstUser,
        shareWith: [firstUser],
      })

      const response = await mutateCreateQuestion({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          parentId: parentMessage.id,
          actionExpectation: {},
        },

        loggedInAs: secondUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { createQuestion: null },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })
  })
})
