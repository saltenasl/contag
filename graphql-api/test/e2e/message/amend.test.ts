import { faker } from '@faker-js/faker'
import createUser from '../drivers/user/create'
import sendMessage from '../drivers/message/send'
import { TypeName } from 'src/constants'
import amendMessage, { mutateAmendMessage } from '../drivers/message/amend'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import createTask from '../drivers/task/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import type { Client, User } from 'src/generated/graphql'
import createFile from '../drivers/file/create'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import removeAllAccessToFile from 'src/filesystem/removeAllAccessToFile'
import removeUserAccessToFile from 'src/filesystem/removeUserAccessToFile'
import userToPublicUser from '../utils/userToPublicUser'
import inviteToClient from '../drivers/clientInvites/create'
import acceptClientInvite from '../drivers/clientInvites/accept'

describe('amendMessage', () => {
  it('amends messages text', async () => {
    const author = await createUser()
    const message = await sendMessage({ author, shareWith: [] })
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateAmendMessage({
      input: {
        id: message.id,
        text,
        richText,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendMessage: expect.objectContaining({
          ...message,
          text,
          richText,
          updatedAt: expect.any(String),
        }),
      },
    })
  })

  describe('attachments', () => {
    it('adds another attachment', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })
      const message = await sendMessage({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const anotherFile = await createFile({ loggedInAs: author })

      const updatedMessage = await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [{ id: file.id }, { id: anotherFile.id }],
      })

      expect(updatedMessage).toStrictEqual(
        expect.objectContaining({
          id: message.id,
          attachments: expect.arrayContaining([file, anotherFile]),
        })
      )
      expect(updatedMessage.attachments).toHaveLength(2)
    })

    it('adds an attachment - allows read access to all the people that are in shareWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(3)
      const someOtherUser = clientMemberUsers[0] as User
      const anotherUser = clientMemberUsers[1] as User

      const message = await sendMessage({
        author,
        shareWith: [someOtherUser, anotherUser],
        attachments: [],
      })

      const file = await createFile({ loggedInAs: author })

      await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [{ id: file.id }],
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

    it('removes an attachment', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })
      const message = await sendMessage({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const updatedMessage = await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedMessage).toStrictEqual(
        expect.objectContaining({
          id: message.id,
          attachments: [],
        })
      )
    })

    it('removes an attachment - removes all accesses from all the people that are in shareWith', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })

      const message = await sendMessage({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(removeAllAccessToFile).toHaveBeenCalledWith({
        filename: file.filename,
      })
    })

    it('another user amends message and keeps the same attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const message = await sendMessage({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedMessage = await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [{ id: file.id }],
      })

      expect(updatedMessage).toStrictEqual(
        expect.objectContaining({
          id: message.id,
          attachments: [file],
        })
      )
    })

    it('removes attachment created by another user', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const message = await sendMessage({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedMessage = await amendMessage({
        id: message.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedMessage).toStrictEqual(
        expect.objectContaining({
          id: message.id,
          attachments: [],
        })
      )
    })

    it('adds attachment to a list of attachments added by other users', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const message = await sendMessage({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const anotherUsersFile = await createFile({ loggedInAs: anotherUser })

      const updatedMessage = await amendMessage({
        id: message.id,
        loggedInAs: anotherUser,
        attachments: [{ id: file.id }, { id: anotherUsersFile.id }],
      })

      expect(updatedMessage).toStrictEqual(
        expect.objectContaining({
          id: message.id,
          attachments: expect.arrayContaining([file, anotherUsersFile]),
        })
      )
      expect(updatedMessage.attachments).toHaveLength(2)
    })

    it('users added to sharedWith are allowed to read attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const file = await createFile({ loggedInAs: author })
      const message = await sendMessage({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      expect(allowUserAccessToFile).not.toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: otherUser.email,
        filename: file.filename,
      })

      await amendMessage({
        loggedInAs: author,
        id: message.id,
        sharedWith: [author, otherUser],
      })

      expect(allowUserAccessToFile).toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: otherUser.email,
        filename: file.filename,
      })
    })

    it('users removed from sharedWith are barred from accessing attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const file = await createFile({ loggedInAs: author })
      const message = await sendMessage({
        author,
        shareWith: [otherUser],
        attachments: [{ id: file.id }],
      })

      expect(removeUserAccessToFile).not.toHaveBeenCalledWith({
        filename: file.filename,
        userEmail: otherUser.email,
      })

      await amendMessage({
        loggedInAs: author,
        id: message.id,
        sharedWith: [author],
      })

      expect(removeUserAccessToFile).toHaveBeenCalledWith({
        filename: file.filename,
        userEmail: otherUser.email,
      })
    })

    describe('errors', () => {
      it('cannot attach a non-existent file', async () => {
        const author = await createUser()
        const message = await sendMessage({ author, shareWith: [] })

        const response = await mutateAmendMessage({
          loggedInAs: author,
          input: {
            id: message.id,
            attachments: [{ id: 'File:-1' }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendMessage: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendMessage'],
            }),
          ],
        })
      })

      it('cannot attach a file which was not created by the current user', async () => {
        const file = await createFile({ loggedInAs: await createUser() })
        const author = await createUser()
        const message = await sendMessage({ author, shareWith: [] })

        const response = await mutateAmendMessage({
          loggedInAs: author,
          input: {
            id: message.id,
            attachments: [{ id: file.id }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendMessage: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendMessage'],
            }),
          ],
        })
      })
    })
  })

  describe('sharedWith', () => {
    it('adds new', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const message = await sendMessage({ author, shareWith: [] })
      expect(message.sharedWith).toHaveLength(1)

      const updatedMessage = await amendMessage({
        loggedInAs: author,
        id: message.id,
        sharedWith: [author, otherUser],
      })

      expect(updatedMessage.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedMessage.sharedWith).toHaveLength(2)
    })

    it('removes existing', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const message = await sendMessage({ author, shareWith: [otherUser] })
      expect(message.sharedWith).toHaveLength(2)

      const updatedMessage = await amendMessage({
        loggedInAs: author,
        id: message.id,
        sharedWith: [author],
      })

      expect(updatedMessage.sharedWith).toStrictEqual(
        expect.arrayContaining([userToPublicUser(author)])
      )
      expect(updatedMessage.sharedWith).toHaveLength(1)
    })

    it('allows to add a new one when there are users in the list which dont share client with the current user', async () => {
      const {
        clientAdminUser: firstUser,
        clientMemberUsers: firstClientMemberUsers,
      } = await createMultipleUsersAndAddToTheSameClient(2)
      const secondUser = firstClientMemberUsers[0] as User

      const {
        clientAdminUser: thirdUser,
        clientMemberUsers: secondClientMemberUsers,
      } = await createMultipleUsersAndAddToTheSameClient(2)
      const fourthUser = secondClientMemberUsers[0] as User

      const clientInvite = await inviteToClient({
        clientId: (thirdUser.clients[0] as unknown as Client).id,
        loggedInAs: thirdUser,
        email: secondUser.email,
      })
      await acceptClientInvite({
        inviteId: clientInvite.id,
        loggedInAs: secondUser,
      })

      // first user is associated with second, second with with third and third with fourth
      // so 2nd creates an item shared with 1st, 2nd and 3rd, then 3rd shares it with 4th.

      const message = await sendMessage({
        author: secondUser,
        shareWith: [firstUser, secondUser, thirdUser],
      })

      const updatedMessage = await amendMessage({
        id: message.id,
        sharedWith: [firstUser, secondUser, thirdUser, fourthUser],
        loggedInAs: thirdUser,
      })

      expect(updatedMessage.sharedWith).toHaveLength(4)
      expect(updatedMessage.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(firstUser),
          userToPublicUser(secondUser),
          userToPublicUser(thirdUser),
          userToPublicUser(fourthUser),
        ])
      )
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const message = await sendMessage({ author, shareWith: [] })

        const response = await mutateAmendMessage({
          input: {
            id: message.id,
            sharedWith: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendMessage: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendMessage'],
            }),
          ],
        })
      })

      it('cannot remove yourself from sharedWith', async () => {
        const author = await createUser()

        const goal = await sendMessage({ author, shareWith: [] })

        const response = await mutateAmendMessage({
          input: {
            id: goal.id,
            sharedWith: [],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendMessage: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Cannot remove yourself from sharedWith',
              path: ['amendMessage'],
            }),
          ],
        })
      })
    })
  })

  describe('errors', () => {
    it('cannot amend message if user is not in the sharedWith', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })
      const stranger = await createUser()

      const text = faker.lorem.sentence()
      const richText = JSON.parse(faker.datatype.json())

      const response = await mutateAmendMessage({
        input: {
          id: message.id,
          text,
          richText,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendMessage'],
          }),
        ],
      })
    })

    it('fails when non existent item id is passed', async () => {
      const response = await mutateAmendMessage({
        input: {
          id: idFromPrismaToGraphQL(-1, TypeName.ITEM),
        },
        loggedInAs: await createUser(),
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendMessage'],
          }),
        ],
      })
    })

    it('fails when non message item is passed', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [] })

      const response = await mutateAmendMessage({
        input: {
          id: task.id,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendMessage'],
          }),
        ],
      })
    })
  })
})
