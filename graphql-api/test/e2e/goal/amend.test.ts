import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import type { Client, User } from 'src/generated/graphql'
import { GoalStatus } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import createGoal from '../drivers/goal/create'
import amendGoal, { mutateAmendGoal } from '../drivers/goal/amend'
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
  it('amends todo goal goalStatus to done', async () => {
    const author = await createUser()

    const goal = await createGoal({ author, shareWith: [] })

    expect(goal.goalStatus).toBe(GoalStatus.Todo)

    const response = await mutateAmendGoal({
      input: {
        id: goal.id,
        goalStatus: GoalStatus.Done,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendGoal: expect.objectContaining({
          id: goal.id,
          goalStatus: GoalStatus.Done,
        }),
      },
    })
  })

  it('allows another user in the same client to amend status', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const anotherUser = clientMemberUsers[0] as User

    const goal = await createGoal({
      author,
      shareWith: [anotherUser],
    })

    expect(goal.goalStatus).toBe(GoalStatus.Todo)

    const response = await mutateAmendGoal({
      input: {
        id: goal.id,
        goalStatus: GoalStatus.Done,
      },
      loggedInAs: anotherUser,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendGoal: expect.objectContaining({
          id: goal.id,
          goalStatus: GoalStatus.Done,
        }),
      },
    })
  })

  it('amend goal status is idempotent', async () => {
    const author = await createUser()
    const goal = await createGoal({ author, shareWith: [] })

    const firstUpdateResponseBody = await amendGoal({
      loggedInAs: author,
      id: goal.id,
      goalStatus: GoalStatus.Done,
    })

    const secondUpdateResponseBody = await amendGoal({
      loggedInAs: author,
      id: goal.id,
      goalStatus: GoalStatus.Done,
    })

    expect(secondUpdateResponseBody).toStrictEqual({
      ...firstUpdateResponseBody,
      updatedAt: expect.any(String),
    })
  })

  it('author amends goals title', async () => {
    const author = await createUser()
    const goal = await createGoal({ author, shareWith: [] })

    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateAmendGoal({
      input: {
        id: goal.id,
        text,
        richText,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendGoal: {
          ...goal,
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
      const goal = await createGoal({ author, shareWith: [] })

      expect(goal.to).toStrictEqual([])

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [{ id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
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

      const goal = await createGoal({ author, to: [author] })

      expect(goal.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [{ id: author.id }, { id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
            to: expect.arrayContaining([
              userToPublicUser(author),
              userToPublicUser(otherUser),
            ]),
            sharedWith: expect.arrayContaining([userToPublicUser(otherUser)]),
          }),
        },
      })
      expect(body.data.amendGoal.to).toHaveLength(2)
    })

    it('removes from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createGoal({ author, to: [author, otherUser] })

      expect(goal.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(goal.to).toHaveLength(2)

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
            to: [userToPublicUser(author)],
          }),
        },
      })
    })

    it('removes all from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createGoal({ author, to: [author, otherUser] })

      expect(goal.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(goal.to).toHaveLength(2)

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
            to: [],
          }),
        },
      })
    })

    it('keeps the same', async () => {
      const author = await createUser()

      const goal = await createGoal({ author, to: [author] })

      expect(goal.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
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

      const goal = await createGoal({
        author,
        to: [otherUser],
        shareWith: [stranger],
      })

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          to: [{ id: otherUser.id }, { id: stranger.id }],
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: expect.objectContaining({
            id: goal.id,
            to: expect.arrayContaining([
              userToPublicUser(otherUser),
              userToPublicUser(stranger),
            ]),
          }),
        },
      })
      expect(body.data.amendGoal.to).toHaveLength(2)
    })

    it('when user is added to `to` - user is also added to sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createGoal({ author, shareWith: [] })
      expect(goal.sharedWith).toHaveLength(1)

      const updatedGoal = await amendGoal({
        loggedInAs: author,
        id: goal.id,
        to: [otherUser],
        sharedWith: [author],
      })

      expect(updatedGoal.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedGoal.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedGoal.sharedWith).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const goal = await createGoal({ author, to: [] })

        const response = await mutateAmendGoal({
          input: {
            id: goal.id,
            to: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendGoal: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendGoal'],
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
      const goal = await createGoal({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const anotherFile = await createFile({ loggedInAs: author })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        attachments: [{ id: file.id }, { id: anotherFile.id }],
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          id: goal.id,
          attachments: expect.arrayContaining([file, anotherFile]),
        })
      )
      expect(updatedGoal.attachments).toHaveLength(2)
    })

    it('adds an attachment - allows read access to all the people that are in shareWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(3)
      const someOtherUser = clientMemberUsers[0] as User
      const anotherUser = clientMemberUsers[1] as User

      const goal = await createGoal({
        author,
        shareWith: [someOtherUser, anotherUser],
        attachments: [],
      })

      const file = await createFile({ loggedInAs: author })

      await amendGoal({
        id: goal.id,
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
      const goal = await createGoal({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          id: goal.id,
          attachments: [],
        })
      )
    })

    it('removes an attachment - removes all accesses from all the people that are in shareWith', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })

      const goal = await createGoal({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendGoal({
        id: goal.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(removeAllAccessToFile).toHaveBeenCalledWith({
        filename: file.filename,
      })
    })

    it('another user amends goal and keeps the same attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const goal = await createGoal({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        attachments: [{ id: file.id }],
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          id: goal.id,
          attachments: [file],
        })
      )
    })

    it('removes attachment created by another user', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const goal = await createGoal({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: author,
        attachments: [],
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          id: goal.id,
          attachments: [],
        })
      )
    })

    it('adds attachment to a list of attachments added by other users', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const goal = await createGoal({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const anotherUsersFile = await createFile({ loggedInAs: anotherUser })

      const updatedGoal = await amendGoal({
        id: goal.id,
        loggedInAs: anotherUser,
        attachments: [{ id: file.id }, { id: anotherUsersFile.id }],
      })

      expect(updatedGoal).toStrictEqual(
        expect.objectContaining({
          id: goal.id,
          attachments: expect.arrayContaining([file, anotherUsersFile]),
        })
      )
      expect(updatedGoal.attachments).toHaveLength(2)
    })

    it('user adds another assignee when item has attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createGoal({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendGoal({
        id: info.id,
        loggedInAs: author,
        to: [author, anotherUser],
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
      const goal = await createGoal({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      expect(allowUserAccessToFile).not.toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: otherUser.email,
        filename: file.filename,
      })

      await amendGoal({
        loggedInAs: author,
        id: goal.id,
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
      const goal = await createGoal({
        author,
        shareWith: [otherUser],
        attachments: [{ id: file.id }],
      })

      expect(removeUserAccessToFile).not.toHaveBeenCalledWith({
        filename: file.filename,
        userEmail: otherUser.email,
      })

      await amendGoal({
        loggedInAs: author,
        id: goal.id,
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
        const goal = await createGoal({ author, shareWith: [] })

        const response = await mutateAmendGoal({
          loggedInAs: author,
          input: {
            id: goal.id,
            attachments: [{ id: 'File:-1' }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendGoal: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendGoal'],
            }),
          ],
        })
      })

      it('cannot attach a file which was not created by the current user', async () => {
        const file = await createFile({ loggedInAs: await createUser() })
        const author = await createUser()
        const goal = await createGoal({ author, shareWith: [] })

        const response = await mutateAmendGoal({
          loggedInAs: author,
          input: {
            id: goal.id,
            attachments: [{ id: file.id }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendGoal: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendGoal'],
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

      const goal = await createGoal({ author, shareWith: [] })
      expect(goal.sharedWith).toHaveLength(1)

      const updatedGoal = await amendGoal({
        loggedInAs: author,
        id: goal.id,
        sharedWith: [author, otherUser],
      })

      expect(updatedGoal.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedGoal.sharedWith).toHaveLength(2)
    })

    it('removes existing', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createGoal({ author, shareWith: [otherUser] })
      expect(goal.sharedWith).toHaveLength(2)

      const updatedGoal = await amendGoal({
        loggedInAs: author,
        id: goal.id,
        sharedWith: [author],
      })

      expect(updatedGoal.sharedWith).toStrictEqual(
        expect.arrayContaining([userToPublicUser(author)])
      )
      expect(updatedGoal.sharedWith).toHaveLength(1)
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

      const goal = await createGoal({
        author: secondUser,
        shareWith: [firstUser, secondUser, thirdUser],
      })

      const updatedGoal = await amendGoal({
        id: goal.id,
        sharedWith: [firstUser, secondUser, thirdUser, fourthUser],
        loggedInAs: thirdUser,
      })

      expect(updatedGoal.sharedWith).toHaveLength(4)
      expect(updatedGoal.sharedWith).toStrictEqual(
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

      const goal = await createGoal({ author, shareWith: [] })
      expect(goal.sharedWith).toHaveLength(1)

      const updatedGoal = await amendGoal({
        loggedInAs: author,
        id: goal.id,
        to: [otherUser],
        sharedWith: [author, otherUser],
      })

      expect(updatedGoal.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedGoal.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedGoal.sharedWith).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const goal = await createGoal({ author, shareWith: [] })

        const response = await mutateAmendGoal({
          input: {
            id: goal.id,
            sharedWith: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendGoal: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendGoal'],
            }),
          ],
        })
      })

      it('cannot remove yourself from sharedWith', async () => {
        const author = await createUser()

        const goal = await createGoal({ author, shareWith: [] })

        const response = await mutateAmendGoal({
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
            amendGoal: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Cannot remove yourself from sharedWith',
              path: ['amendGoal'],
            }),
          ],
        })
      })
    })
  })

  describe('errors', () => {
    it('cannot amend goal if user is not in the sharedWith', async () => {
      const author = await createUser()
      const goal = await createGoal({ author, shareWith: [] })
      const stranger = await createUser()

      const text = faker.lorem.sentence()
      const richText = JSON.parse(faker.datatype.json())

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          text,
          richText,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendGoal'],
          }),
        ],
      })
    })

    it('returns goal not found when non-existent goal id is passed', async () => {
      const author = await createUser()

      const response = await mutateAmendGoal({
        input: {
          id: idFromPrismaToGraphQL(-1, TypeName.ITEM),
          goalStatus: GoalStatus.Done,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendGoal'],
          }),
        ],
      })
    })

    it('returns goal not found when updating goal which sharedWith doesnt include current user', async () => {
      const author = await createUser()
      const anotherUser = await createUser()

      const goal = await createGoal({ author, shareWith: [] })

      const response = await mutateAmendGoal({
        input: {
          id: goal.id,
          goalStatus: GoalStatus.Done,
        },
        loggedInAs: anotherUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendGoal'],
          }),
        ],
      })
    })
  })
})
