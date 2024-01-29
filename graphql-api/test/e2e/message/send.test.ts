import { faker } from '@faker-js/faker'
import createUser from '../drivers/user/create'
import sendMessage, { mutateSendMessage } from '../drivers/message/send'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import type { User } from 'src/generated/graphql'
import inviteToClient from '../drivers/clientInvites/create'
import acceptClientInvite from '../drivers/clientInvites/accept'
import userToPublicUser from '../utils/userToPublicUser'
import createFile from '../drivers/file/create'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'

describe('sendMessage', () => {
  it('sends a message and shares it with a person', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateSendMessage({
      input: {
        text,
        richText,
        shareWith: [{ id: recipient.id }],
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        sendMessage: {
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
          isAcceptedAnswer: null,
          summary: null,
          attachments: [],
        },
      },
    })

    expect(body.data.sendMessage.sharedWith).toHaveLength(2)
  })

  it('sends a message and shares it with multiple people', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const firstRecipient = clientMemberUsers[0] as User
    const secondRecipient = clientMemberUsers[1] as User

    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateSendMessage({
      input: {
        text,
        richText,
        shareWith: [{ id: firstRecipient.id }, { id: secondRecipient.id }],
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        sendMessage: {
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
          isAcceptedAnswer: null,
          summary: null,
          attachments: [],
        },
      },
    })
    expect(body.data.sendMessage.sharedWith).toHaveLength(3)
  })

  it('filters current user out of the shareWith', async () => {
    const user = await createUser()

    const message = await sendMessage({ author: user, shareWith: [user] })

    expect(message).toStrictEqual(
      expect.objectContaining({ id: expect.any(String) })
    )
  })

  it('user that belongs to multiple clients sends a message to themselves', async () => {
    const { clientAdminUser: user, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const anotherUser = clientMemberUsers[0] as User

    const clientInvite = await inviteToClient({
      clientId: anotherUser.clients[0]?.id as string,
      loggedInAs: anotherUser,
      email: user.email,
    })
    await acceptClientInvite({ inviteId: clientInvite.id, loggedInAs: user })

    const message = await sendMessage({ author: user, shareWith: [user] })

    expect(message).toStrictEqual(
      expect.objectContaining({ id: expect.any(String) })
    )
  })

  it('sends a message with attachments', async () => {
    const author = await createUser()
    const file = await createFile({ loggedInAs: author })

    const message = await sendMessage({
      author,
      attachments: [{ id: file.id }],
      shareWith: [],
    })

    expect(message).toStrictEqual(
      expect.objectContaining({
        attachments: [file],
      })
    )
  })

  it('sends message with attachment - allows read access to all the people that are in shareWith', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const someOtherUser = clientMemberUsers[0] as User
    const anotherUser = clientMemberUsers[1] as User

    const file = await createFile({ loggedInAs: author })

    await sendMessage({
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
    it("cannot share a message with a person with whom user doesn't share any clients", async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateSendMessage({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [{ id: recipient.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { sendMessage: null },
        errors: [
          expect.objectContaining({
            message: 'Recipient not found',
            path: ['sendMessage'],
          }),
        ],
      })
    })

    it('cannot attach a non-existent file', async () => {
      const loggedInAs = await createUser()

      const response = await mutateSendMessage({
        loggedInAs,
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [],
          attachments: [{ id: 'File:-1' }],
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          sendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['sendMessage'],
          }),
        ],
      })
    })

    it('cannot attach a file which was not created by the current user', async () => {
      const stranger = await createUser()
      const file = await createFile({ loggedInAs: stranger })

      const response = await mutateSendMessage({
        loggedInAs: await createUser(),
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [],
          attachments: [{ id: file.id }],
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          sendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Attachment(s) not found',
            path: ['sendMessage'],
          }),
        ],
      })
    })
  })
})
