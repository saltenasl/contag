import { faker } from '@faker-js/faker'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import type { User } from 'src/generated/graphql'
import { ActionExpectationType } from 'src/generated/graphql'
import { TaskStatus } from 'src/generated/graphql'
import createFile from '../drivers/file/create'
import createTask, { mutateCreateTask } from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'

describe('create', () => {
  it('creates a task and shares it with a person', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateTask({
      input: {
        text,
        richText,
        shareWith: [{ id: recipient.id }],
        actionExpectation: {},
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createTask: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          to: [],
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(recipient),
          ]),
          status: TaskStatus.Todo,
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isAcceptedAnswer: null,
          actionExpectation: {
            type: ActionExpectationType.ActionExpectedFromYou,
            completeUntil: null,
            fulfilled: false,
          },
          summary: null,
          attachments: [],
        },
      },
    })

    expect(body.data.createTask.sharedWith).toHaveLength(2)
  })

  it('creates a task and shares it with multiple people', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const firstRecipient = clientMemberUsers[0] as User
    const secondRecipient = clientMemberUsers[1] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateTask({
      input: {
        text,
        richText,
        shareWith: [{ id: firstRecipient.id }, { id: secondRecipient.id }],
        actionExpectation: {},
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createTask: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          status: TaskStatus.Todo,
          to: [],
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(firstRecipient),
            userToPublicUser(secondRecipient),
          ]),
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isAcceptedAnswer: null,
          actionExpectation: {
            type: ActionExpectationType.ActionExpectedFromYou,
            completeUntil: null,
            fulfilled: false,
          },
          summary: null,
          attachments: [],
        },
      },
    })
    expect(body.data.createTask.sharedWith).toHaveLength(3)
  })

  it('addresses a task to a specific person', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateTask({
      input: {
        text,
        richText,
        to: [{ id: recipient.id }],
        actionExpectation: {},
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createTask: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          to: expect.arrayContaining([userToPublicUser(recipient)]),
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(recipient),
          ]),
          status: TaskStatus.Todo,
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isAcceptedAnswer: null,
          actionExpectation: {
            type: ActionExpectationType.ActionExpected,
            completeUntil: null,
            fulfilled: false,
          },
          summary: null,
          attachments: [],
        },
      },
    })

    expect(body.data.createTask.sharedWith).toHaveLength(2)
  })

  it('addresses a task to multiple people', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const firstRecipient = clientMemberUsers[0] as User
    const secondRecipient = clientMemberUsers[1] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateTask({
      input: {
        text,
        richText,
        to: [{ id: firstRecipient.id }, { id: secondRecipient.id }],
        actionExpectation: {},
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createTask: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          to: expect.arrayContaining([
            userToPublicUser(firstRecipient),
            userToPublicUser(secondRecipient),
          ]),
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(firstRecipient),
            userToPublicUser(secondRecipient),
          ]),
          status: TaskStatus.Todo,
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isAcceptedAnswer: null,
          actionExpectation: {
            type: ActionExpectationType.ActionExpected,
            completeUntil: null,
            fulfilled: false,
          },
          summary: null,
          attachments: [],
        },
      },
    })

    expect(body.data.createTask.sharedWith).toHaveLength(3)
  })

  it('recipient in both shareWith and to', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateTask({
      input: {
        text,
        richText,
        to: [{ id: recipient.id }],
        shareWith: [{ id: recipient.id }],
        actionExpectation: {},
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createTask: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          to: expect.arrayContaining([userToPublicUser(recipient)]),
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(recipient),
          ]),
          status: TaskStatus.Todo,
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isAcceptedAnswer: null,
          actionExpectation: {
            type: ActionExpectationType.ActionExpected,
            completeUntil: null,
            fulfilled: false,
          },
          summary: null,
          attachments: [],
        },
      },
    })

    expect(body.data.createTask.sharedWith).toHaveLength(2)
  })

  it('creates a task with attachments', async () => {
    const author = await createUser()
    const file = await createFile({ loggedInAs: author })

    const task = await createTask({
      author,
      attachments: [{ id: file.id }],
      shareWith: [],
    })

    expect(task).toStrictEqual(
      expect.objectContaining({
        attachments: [file],
      })
    )
  })

  it('creates task with attachment - allows read access to all the people that are in shareWith', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const someOtherUser = clientMemberUsers[0] as User
    const anotherUser = clientMemberUsers[1] as User

    const file = await createFile({ loggedInAs: author })

    await createTask({
      author,
      attachments: [{ id: file.id }],
      shareWith: [someOtherUser, anotherUser],
    })

    const sharedWith = [author, someOtherUser, anotherUser]

    sharedWith.forEach(({ email }) => {
      expect(allowUserAccessToFile).toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: email,
        filename: file.filename,
      })
    })
  })

  describe('errors', () => {
    it("cannot share a task with a person with whom user doesn't share any clients", async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateTask({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [{ id: recipient.id }],
          actionExpectation: {},
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { createTask: null },
        errors: [
          expect.objectContaining({
            message: 'Recipient not found',
            path: ['createTask'],
          }),
        ],
      })
    })

    it("cannot address a task to a person with whom user doesn't share any clients", async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateTask({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [],
          to: [{ id: recipient.id }],
          actionExpectation: {},
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { createTask: null },
        errors: [
          expect.objectContaining({
            message: 'Recipient not found',
            path: ['createTask'],
          }),
        ],
      })
    })

    it('cannot attach a non-existent file', async () => {
      const loggedInAs = await createUser()

      const response = await mutateCreateTask({
        loggedInAs,
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [],
          attachments: [{ id: 'File:-1' }],
          actionExpectation: {},
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          createTask: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['createTask'],
          }),
        ],
      })
    })

    it('cannot attach a file which was not created by the current user', async () => {
      const stranger = await createUser()
      const file = await createFile({ loggedInAs: stranger })

      const response = await mutateCreateTask({
        loggedInAs: await createUser(),
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [],
          attachments: [{ id: file.id }],
          actionExpectation: {},
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          createTask: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['createTask'],
          }),
        ],
      })
    })
  })
})
