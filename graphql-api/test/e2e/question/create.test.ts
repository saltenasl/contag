import { faker } from '@faker-js/faker'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import type { User } from 'src/generated/graphql'
import { ActionExpectationType } from 'src/generated/graphql'
import createFile from '../drivers/file/create'
import createQuestion, {
  mutateCreateQuestion,
} from '../drivers/question/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'

describe('createQuestion', () => {
  it('creates a question', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateQuestion({
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
        createQuestion: {
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
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          acceptedAnswer: null,
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

    expect(body.data.createQuestion.sharedWith).toHaveLength(2)
  })

  it('creates a question and shares it with multiple people', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const firstRecipient = clientMemberUsers[0] as User
    const secondRecipient = clientMemberUsers[1] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateQuestion({
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
        createQuestion: {
          id: expect.any(String),
          parentId: null,
          author: userToPublicUser(author),
          text,
          richText,
          to: [],
          sharedWith: expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(firstRecipient),
            userToPublicUser(secondRecipient),
          ]),
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          acceptedAnswer: null,
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
    expect(body.data.createQuestion.sharedWith).toHaveLength(3)
  })

  it('addresses question to a specific person', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateQuestion({
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
        createQuestion: {
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
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          acceptedAnswer: null,
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

    expect(body.data.createQuestion.sharedWith).toHaveLength(2)
  })

  it('addresses question to multiple people', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const firstRecipient = clientMemberUsers[0] as User
    const secondRecipient = clientMemberUsers[1] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateQuestion({
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
        createQuestion: {
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
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          acceptedAnswer: null,
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

    expect(body.data.createQuestion.sharedWith).toHaveLength(3)
  })

  it('recipient is in both sharedWith and to', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateCreateQuestion({
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
        createQuestion: {
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
          childCount: 0,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          acceptedAnswer: null,
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

    expect(body.data.createQuestion.sharedWith).toHaveLength(2)
  })

  it('creates a question with attachments', async () => {
    const author = await createUser()
    const file = await createFile({ loggedInAs: author })

    const question = await createQuestion({
      author,
      attachments: [{ id: file.id }],
      shareWith: [],
    })

    expect(question).toStrictEqual(
      expect.objectContaining({
        attachments: [file],
      })
    )
  })

  it('creates question with attachment - allows read access to all the people that are in shareWith', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const someOtherUser = clientMemberUsers[0] as User
    const anotherUser = clientMemberUsers[1] as User

    const file = await createFile({ loggedInAs: author })

    await createQuestion({
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
    it("cannot share question with a person with whom user doesn't share any clients", async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateQuestion({
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
        data: { createQuestion: null },
        errors: [
          expect.objectContaining({
            message: 'Recipient not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it("cannot address question to a person with whom user doesn't share any clients", async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateQuestion({
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
        data: { createQuestion: null },
        errors: [
          expect.objectContaining({
            message: 'Recipient not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it('cannot attach a non-existent file', async () => {
      const loggedInAs = await createUser()

      const response = await mutateCreateQuestion({
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
          createQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })

    it('cannot attach a file which was not created by the current user', async () => {
      const stranger = await createUser()
      const file = await createFile({ loggedInAs: stranger })

      const response = await mutateCreateQuestion({
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
          createQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['createQuestion'],
          }),
        ],
      })
    })
  })
})
