import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import type { Client, User } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import createInfo from '../drivers/info/create'
import amendInfo, { mutateAmendInfo } from '../drivers/info/amend'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'
import inviteToClient from '../drivers/clientInvites/create'
import acceptClientInvite from '../drivers/clientInvites/accept'
import createFile from '../drivers/file/create'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import removeAllAccessToFile from 'src/filesystem/removeAllAccessToFile'
import removeUserAccessToFile from 'src/filesystem/removeUserAccessToFile'

describe('amend', () => {
  it('amends acknowledged to true', async () => {
    const author = await createUser()

    const info = await createInfo({ author, shareWith: [] })

    expect(info.acknowledged).toBe(false)

    const response = await mutateAmendInfo({
      input: {
        id: info.id,
        acknowledged: true,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendInfo: expect.objectContaining({
          id: info.id,
          acknowledged: true,
        }),
      },
    })
  })

  it('allows another user in the same client to amend acknowledged', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const anotherUser = clientMemberUsers[0] as User

    const info = await createInfo({
      author,
      shareWith: [anotherUser],
    })

    expect(info.acknowledged).toBe(false)

    const response = await mutateAmendInfo({
      input: {
        id: info.id,
        acknowledged: true,
      },
      loggedInAs: anotherUser,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendInfo: expect.objectContaining({
          id: info.id,
          acknowledged: true,
        }),
      },
    })
  })

  it('amend info acknowledged is idempotent', async () => {
    const author = await createUser()
    const info = await createInfo({ author, shareWith: [] })

    const firstUpdateResponseBody = await amendInfo({
      loggedInAs: author,
      id: info.id,
      acknowledged: true,
    })

    const secondUpdateResponseBody = await amendInfo({
      loggedInAs: author,
      id: info.id,
      acknowledged: true,
    })

    expect(secondUpdateResponseBody).toStrictEqual({
      ...firstUpdateResponseBody,
      updatedAt: expect.any(String),
    })
  })

  it('author amends infos text', async () => {
    const author = await createUser()
    const info = await createInfo({ author, shareWith: [] })

    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateAmendInfo({
      input: {
        id: info.id,
        text,
        richText,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendInfo: {
          ...info,
          text,
          richText,
          updatedAt: expect.any(String),
        },
      },
    })
  })

  describe(`to`, () => {
    it('adds new to empty list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User
      const info = await createInfo({ author, shareWith: [] })

      expect(info.to).toStrictEqual([])

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [{ id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: [userToPublicUser(otherUser)],
            sharedWith: expect.arrayContaining([userToPublicUser(otherUser)]),
          }),
        },
      })
    })

    it('adds new to existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const info = await createInfo({ author, to: [author] })

      expect(info.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [{ id: author.id }, { id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: expect.arrayContaining([
              userToPublicUser(author),
              userToPublicUser(otherUser),
            ]),
            sharedWith: expect.arrayContaining([userToPublicUser(otherUser)]),
          }),
        },
      })
      expect(body.data.amendInfo.to).toHaveLength(2)
    })

    it('removes from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const info = await createInfo({ author, to: [author, otherUser] })

      expect(info.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(info.to).toHaveLength(2)

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: [userToPublicUser(author)],
          }),
        },
      })
    })

    it('removes all from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const info = await createInfo({ author, to: [author, otherUser] })

      expect(info.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(info.to).toHaveLength(2)

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: [],
          }),
        },
      })
    })

    it('keeps the same', async () => {
      const author = await createUser()

      const info = await createInfo({ author, to: [author] })

      expect(info.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: [userToPublicUser(author)],
          }),
        },
      })
    })

    it("allows to add a new assignee when user doesn't share clients with one of already defined assignees", async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const stranger = await createUser()
      const clientInvite = await inviteToClient({
        clientId: (stranger.clients[0] as unknown as Client).id,
        loggedInAs: stranger,
        email: author.email,
      })
      await acceptClientInvite({
        inviteId: clientInvite.id,
        loggedInAs: author,
      })

      const info = await createInfo({
        author,
        to: [otherUser],
        shareWith: [stranger],
      })

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          to: [{ id: otherUser.id }, { id: stranger.id }],
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: expect.objectContaining({
            id: info.id,
            to: expect.arrayContaining([
              userToPublicUser(otherUser),
              userToPublicUser(stranger),
            ]),
          }),
        },
      })
      expect(body.data.amendInfo.to).toHaveLength(2)
    })

    it('when user is added to `to` - user is also added to sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createInfo({ author, shareWith: [] })
      expect(goal.sharedWith).toHaveLength(1)

      const updatedInfo = await amendInfo({
        loggedInAs: author,
        id: goal.id,
        to: [otherUser],
        sharedWith: [author],
      })

      expect(updatedInfo.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedInfo.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedInfo.sharedWith).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const info = await createInfo({ author, to: [] })

        const response = await mutateAmendInfo({
          input: {
            id: info.id,
            to: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendInfo: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendInfo'],
            }),
          ],
        })
      })
    })
  })

  describe('attachments', () => {
    it('adds another attachment', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })
      const info = await createInfo({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const anotherFile = await createFile({ loggedInAs: author })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        attachments: [{ id: file.id }, { id: anotherFile.id }],
      })

      expect(updatedInfo).toStrictEqual(
        expect.objectContaining({
          id: info.id,
          attachments: expect.arrayContaining([file, anotherFile]),
        })
      )
      expect(updatedInfo.attachments).toHaveLength(2)
    })

    it('adds an attachment - allows read access to all the people that are in shareWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(3)
      const someOtherUser = clientMemberUsers[0] as User
      const anotherUser = clientMemberUsers[1] as User

      const info = await createInfo({
        author,
        shareWith: [someOtherUser, anotherUser],
        attachments: [],
      })

      const file = await createFile({ loggedInAs: author })

      await amendInfo({
        id: info.id,
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
      const info = await createInfo({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedInfo).toStrictEqual(
        expect.objectContaining({
          id: info.id,
          attachments: [],
        })
      )
    })

    it('removes an attachment - removes all accesses from all the people that are in shareWith', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })

      const info = await createInfo({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendInfo({
        id: info.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(removeAllAccessToFile).toHaveBeenCalledWith({
        filename: file.filename,
      })
    })

    it('another user amends info and keeps the same attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createInfo({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        attachments: [{ id: file.id }],
      })

      expect(updatedInfo).toStrictEqual(
        expect.objectContaining({
          id: info.id,
          attachments: [file],
        })
      )
    })

    it('removes attachment created by another user', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createInfo({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedInfo).toStrictEqual(
        expect.objectContaining({
          id: info.id,
          attachments: [],
        })
      )
    })

    it('adds attachment to a list of attachments added by other users', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createInfo({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const anotherUsersFile = await createFile({ loggedInAs: anotherUser })

      const updatedInfo = await amendInfo({
        id: info.id,
        loggedInAs: anotherUser,
        attachments: [{ id: file.id }, { id: anotherUsersFile.id }],
      })

      expect(updatedInfo).toStrictEqual(
        expect.objectContaining({
          id: info.id,
          attachments: expect.arrayContaining([file, anotherUsersFile]),
        })
      )
      expect(updatedInfo.attachments).toHaveLength(2)
    })

    it('user adds another assignee when item has attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createInfo({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendInfo({
        id: info.id,
        loggedInAs: author,
        to: [anotherUser],
      })

      expect(allowUserAccessToFile).toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: anotherUser.email,
        filename: file.filename,
      })
    })

    it('users added to sharedWith are allowed to read attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const file = await createFile({ loggedInAs: author })
      const info = await createInfo({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      expect(allowUserAccessToFile).not.toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: otherUser.email,
        filename: file.filename,
      })

      await amendInfo({
        loggedInAs: author,
        id: info.id,
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
      const info = await createInfo({
        author,
        shareWith: [otherUser],
        attachments: [{ id: file.id }],
      })

      expect(removeUserAccessToFile).not.toHaveBeenCalledWith({
        filename: file.filename,
        userEmail: otherUser.email,
      })

      await amendInfo({
        loggedInAs: author,
        id: info.id,
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
        const info = await createInfo({ author, shareWith: [] })

        const response = await mutateAmendInfo({
          loggedInAs: author,
          input: {
            id: info.id,
            attachments: [{ id: 'File:-1' }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendInfo: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendInfo'],
            }),
          ],
        })
      })

      it('cannot attach a file which was not created by the current user', async () => {
        const file = await createFile({ loggedInAs: await createUser() })
        const author = await createUser()
        const info = await createInfo({ author, shareWith: [] })

        const response = await mutateAmendInfo({
          loggedInAs: author,
          input: {
            id: info.id,
            attachments: [{ id: file.id }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendInfo: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendInfo'],
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

      const info = await createInfo({ author, shareWith: [] })
      expect(info.sharedWith).toHaveLength(1)

      const updatedInfo = await amendInfo({
        loggedInAs: author,
        id: info.id,
        sharedWith: [author, otherUser],
      })

      expect(updatedInfo.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedInfo.sharedWith).toHaveLength(2)
    })

    it('removes existing', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const info = await createInfo({ author, shareWith: [otherUser] })
      expect(info.sharedWith).toHaveLength(2)

      const updatedInfo = await amendInfo({
        loggedInAs: author,
        id: info.id,
        sharedWith: [author],
      })

      expect(updatedInfo.sharedWith).toStrictEqual(
        expect.arrayContaining([userToPublicUser(author)])
      )
      expect(updatedInfo.sharedWith).toHaveLength(1)
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

      const info = await createInfo({
        author: secondUser,
        shareWith: [firstUser, secondUser, thirdUser],
      })

      const updatedInfo = await amendInfo({
        id: info.id,
        sharedWith: [firstUser, secondUser, thirdUser, fourthUser],
        loggedInAs: thirdUser,
      })

      expect(updatedInfo.sharedWith).toHaveLength(4)
      expect(updatedInfo.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(firstUser),
          userToPublicUser(secondUser),
          userToPublicUser(thirdUser),
          userToPublicUser(fourthUser),
        ])
      )
    })

    it('user being added to both `to` and sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const info = await createInfo({ author, shareWith: [] })
      expect(info.sharedWith).toHaveLength(1)

      const updatedInfo = await amendInfo({
        loggedInAs: author,
        id: info.id,
        to: [otherUser],
        sharedWith: [author, otherUser],
      })

      expect(updatedInfo.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedInfo.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedInfo.sharedWith).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const info = await createInfo({ author, shareWith: [] })

        const response = await mutateAmendInfo({
          input: {
            id: info.id,
            sharedWith: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendInfo: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendInfo'],
            }),
          ],
        })
      })

      it('cannot remove yourself from sharedWith', async () => {
        const author = await createUser()

        const goal = await createInfo({ author, shareWith: [] })

        const response = await mutateAmendInfo({
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
            amendInfo: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Cannot remove yourself from sharedWith',
              path: ['amendInfo'],
            }),
          ],
        })
      })
    })
  })

  describe('errors', () => {
    it('cannot amend info if user is not in the sharedWith', async () => {
      const author = await createUser()
      const info = await createInfo({ author, shareWith: [] })
      const stranger = await createUser()

      const text = faker.lorem.sentence()
      const richText = JSON.parse(faker.datatype.json())

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          text,
          richText,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendInfo'],
          }),
        ],
      })
    })

    it('returns info not found when non-existent info id is passed', async () => {
      const author = await createUser()

      const response = await mutateAmendInfo({
        input: {
          id: idFromPrismaToGraphQL(-1, TypeName.ITEM),
          acknowledged: true,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendInfo'],
          }),
        ],
      })
    })

    it('returns info not found when updating info which sharedWith doesnt include current user', async () => {
      const author = await createUser()
      const anotherUser = await createUser()

      const info = await createInfo({ author, shareWith: [] })

      const response = await mutateAmendInfo({
        input: {
          id: info.id,
          acknowledged: true,
        },
        loggedInAs: anotherUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendInfo: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendInfo'],
          }),
        ],
      })
    })
  })
})
