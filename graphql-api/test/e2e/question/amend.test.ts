import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import removeAllAccessToFile from 'src/filesystem/removeAllAccessToFile'
import removeUserAccessToFile from 'src/filesystem/removeUserAccessToFile'
import type { Client, User } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import acceptClientInvite from '../drivers/clientInvites/accept'
import inviteToClient from '../drivers/clientInvites/create'
import createFile from '../drivers/file/create'
import amendQuestion, { mutateAmendQuestion } from '../drivers/question/amend'
import createQuestion from '../drivers/question/create'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'

describe('amendQuestion', () => {
  it('amends questions text', async () => {
    const author = await createUser()
    const question = await createQuestion({ author, shareWith: [] })
    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateAmendQuestion({
      input: {
        id: question.id,
        text,
        richText,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendQuestion: expect.objectContaining({
          ...question,
          text,
          richText,
          updatedAt: expect.any(String),
        }),
      },
    })
  })

  describe(`to`, () => {
    it('adds new to empty list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User
      const question = await createQuestion({ author, shareWith: [] })

      expect(question.to).toStrictEqual([])

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [{ id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
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

      const question = await createQuestion({ author, to: [author] })

      expect(question.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [{ id: author.id }, { id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
            to: expect.arrayContaining([
              userToPublicUser(author),
              userToPublicUser(otherUser),
            ]),
            sharedWith: expect.arrayContaining([userToPublicUser(otherUser)]),
          }),
        },
      })
      expect(body.data.amendQuestion.to).toHaveLength(2)
    })

    it('removes from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const question = await createQuestion({ author, to: [author, otherUser] })

      expect(question.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(question.to).toHaveLength(2)

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
            to: [userToPublicUser(author)],
          }),
        },
      })
    })

    it('removes all from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const question = await createQuestion({ author, to: [author, otherUser] })

      expect(question.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(question.to).toHaveLength(2)

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
            to: [],
          }),
        },
      })
    })

    it('keeps the same', async () => {
      const author = await createUser()

      const question = await createQuestion({ author, to: [author] })

      expect(question.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
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

      const question = await createQuestion({
        author,
        to: [otherUser],
        shareWith: [stranger],
      })

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          to: [{ id: otherUser.id }, { id: stranger.id }],
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: expect.objectContaining({
            id: question.id,
            to: expect.arrayContaining([
              userToPublicUser(otherUser),
              userToPublicUser(stranger),
            ]),
          }),
        },
      })
      expect(body.data.amendQuestion.to).toHaveLength(2)
    })

    it('when user is added to `to` - user is also added to sharedWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const goal = await createQuestion({ author, shareWith: [] })
      expect(goal.sharedWith).toHaveLength(1)

      const updatedQuestion = await amendQuestion({
        author,
        id: goal.id,
        to: [otherUser],
        sharedWith: [author],
      })

      expect(updatedQuestion.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedQuestion.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedQuestion.sharedWith).toHaveLength(2)
    })

    describe('attachments', () => {
      it('adds another attachment', async () => {
        const author = await createUser()
        const file = await createFile({ loggedInAs: author })
        const question = await createQuestion({
          author,
          shareWith: [],
          attachments: [{ id: file.id }],
        })

        const anotherFile = await createFile({ loggedInAs: author })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          author,
          attachments: [{ id: file.id }, { id: anotherFile.id }],
        })

        expect(updatedQuestion).toStrictEqual(
          expect.objectContaining({
            id: question.id,
            attachments: expect.arrayContaining([file, anotherFile]),
          })
        )
        expect(updatedQuestion.attachments).toHaveLength(2)
      })

      it('adds an attachment - allows read access to all the people that are in shareWith', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(3)
        const someOtherUser = clientMemberUsers[0] as User
        const anotherUser = clientMemberUsers[1] as User

        const question = await createQuestion({
          author,
          shareWith: [someOtherUser, anotherUser],
          attachments: [],
        })

        const file = await createFile({ loggedInAs: author })

        await amendQuestion({
          id: question.id,
          author,
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
        const question = await createQuestion({
          author,
          shareWith: [],
          attachments: [{ id: file.id }],
        })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          author,
          attachments: [],
        })

        expect(updatedQuestion).toStrictEqual(
          expect.objectContaining({
            id: question.id,
            attachments: [],
          })
        )
      })

      it('removes an attachment - removes all accesses from all the people that are in shareWith', async () => {
        const author = await createUser()
        const file = await createFile({ loggedInAs: author })

        const question = await createQuestion({
          author,
          shareWith: [],
          attachments: [{ id: file.id }],
        })

        await amendQuestion({
          id: question.id,
          author,
          attachments: [],
        })

        expect(removeAllAccessToFile).toHaveBeenCalledWith({
          filename: file.filename,
        })
      })

      it('another user amends question and keeps the same attachments', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const anotherUser = clientMemberUsers[0] as User
        const file = await createFile({ loggedInAs: author })

        const question = await createQuestion({
          author,
          shareWith: [anotherUser],
          attachments: [{ id: file.id }],
        })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          author,
          attachments: [{ id: file.id }],
        })

        expect(updatedQuestion).toStrictEqual(
          expect.objectContaining({
            id: question.id,
            attachments: [file],
          })
        )
      })

      it('removes attachment created by another user', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const anotherUser = clientMemberUsers[0] as User
        const file = await createFile({ loggedInAs: author })

        const question = await createQuestion({
          author,
          shareWith: [anotherUser],
          attachments: [{ id: file.id }],
        })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          author,
          attachments: [],
        })

        expect(updatedQuestion).toStrictEqual(
          expect.objectContaining({
            id: question.id,
            attachments: [],
          })
        )
      })

      it('adds attachment to a list of attachments added by other users', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const anotherUser = clientMemberUsers[0] as User
        const file = await createFile({ loggedInAs: author })

        const question = await createQuestion({
          author,
          shareWith: [anotherUser],
          attachments: [{ id: file.id }],
        })

        const anotherUsersFile = await createFile({ loggedInAs: anotherUser })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          author: anotherUser,
          attachments: [{ id: file.id }, { id: anotherUsersFile.id }],
        })

        expect(updatedQuestion).toStrictEqual(
          expect.objectContaining({
            id: question.id,
            attachments: expect.arrayContaining([file, anotherUsersFile]),
          })
        )
        expect(updatedQuestion.attachments).toHaveLength(2)
      })

      it('user adds another assignee when item has attachments', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const anotherUser = clientMemberUsers[0] as User
        const file = await createFile({ loggedInAs: author })

        const info = await createQuestion({
          author,
          shareWith: [],
          attachments: [{ id: file.id }],
        })

        await amendQuestion({
          id: info.id,
          author,
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
        const question = await createQuestion({
          author,
          shareWith: [],
          attachments: [{ id: file.id }],
        })

        expect(allowUserAccessToFile).not.toHaveBeenCalledWith({
          operations: ['read'],
          userEmail: otherUser.email,
          filename: file.filename,
        })

        await amendQuestion({
          author,
          id: question.id,
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
        const question = await createQuestion({
          author,
          shareWith: [otherUser],
          attachments: [{ id: file.id }],
        })

        expect(removeUserAccessToFile).not.toHaveBeenCalledWith({
          filename: file.filename,
          userEmail: otherUser.email,
        })

        await amendQuestion({
          author,
          id: question.id,
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
          const question = await createQuestion({ author, shareWith: [] })

          const response = await mutateAmendQuestion({
            loggedInAs: author,
            input: {
              id: question.id,
              attachments: [{ id: 'File:-1' }],
            },
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              amendQuestion: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Attachment(s) not found',
                path: ['amendQuestion'],
              }),
            ],
          })
        })

        it('cannot attach a file which was not created by the current user', async () => {
          const file = await createFile({ loggedInAs: await createUser() })
          const author = await createUser()
          const question = await createQuestion({ author, shareWith: [] })

          const response = await mutateAmendQuestion({
            loggedInAs: author,
            input: {
              id: question.id,
              attachments: [{ id: file.id }],
            },
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              amendQuestion: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Attachment(s) not found',
                path: ['amendQuestion'],
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

        const question = await createQuestion({ author, shareWith: [] })
        expect(question.sharedWith).toHaveLength(1)

        const updatedQuestion = await amendQuestion({
          author,
          id: question.id,
          sharedWith: [author, otherUser],
        })

        expect(updatedQuestion.sharedWith).toStrictEqual(
          expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(otherUser),
          ])
        )
        expect(updatedQuestion.sharedWith).toHaveLength(2)
      })

      it('removes existing', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const otherUser = clientMemberUsers[0] as User

        const question = await createQuestion({
          author,
          shareWith: [otherUser],
        })
        expect(question.sharedWith).toHaveLength(2)

        const updatedQuestion = await amendQuestion({
          author,
          id: question.id,
          sharedWith: [author],
        })

        expect(updatedQuestion.sharedWith).toStrictEqual(
          expect.arrayContaining([userToPublicUser(author)])
        )
        expect(updatedQuestion.sharedWith).toHaveLength(1)
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

        const question = await createQuestion({
          author: secondUser,
          shareWith: [firstUser, secondUser, thirdUser],
        })

        const updatedQuestion = await amendQuestion({
          id: question.id,
          sharedWith: [firstUser, secondUser, thirdUser, fourthUser],
          author: thirdUser,
        })

        expect(updatedQuestion.sharedWith).toHaveLength(4)
        expect(updatedQuestion.sharedWith).toStrictEqual(
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

        const question = await createQuestion({ author, shareWith: [] })
        expect(question.sharedWith).toHaveLength(1)

        const updatedQuestion = await amendQuestion({
          author,
          id: question.id,
          to: [otherUser],
          sharedWith: [author, otherUser],
        })

        expect(updatedQuestion.sharedWith).toStrictEqual(
          expect.arrayContaining([
            userToPublicUser(author),
            userToPublicUser(otherUser),
          ])
        )
        expect(updatedQuestion.to).toStrictEqual([userToPublicUser(otherUser)])
        expect(updatedQuestion.sharedWith).toHaveLength(2)
      })

      describe('errors', () => {
        it("returns recipient not found when recipient doesn't share a client with current user", async () => {
          const author = await createUser()
          const stranger = await createUser()

          const question = await createQuestion({ author, shareWith: [] })

          const response = await mutateAmendQuestion({
            input: {
              id: question.id,
              sharedWith: [{ id: stranger.id }],
            },
            loggedInAs: author,
          })

          expect(response.status).toBe(200)

          const body = await response.json()

          expect(body).toStrictEqual({
            data: {
              amendQuestion: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Recipient not found',
                path: ['amendQuestion'],
              }),
            ],
          })
        })

        it('cannot remove yourself from sharedWith', async () => {
          const author = await createUser()

          const goal = await createQuestion({ author, shareWith: [] })

          const response = await mutateAmendQuestion({
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
              amendQuestion: null,
            },
            errors: [
              expect.objectContaining({
                message: 'Cannot remove yourself from sharedWith',
                path: ['amendQuestion'],
              }),
            ],
          })
        })
      })
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const question = await createQuestion({ author, to: [] })

        const response = await mutateAmendQuestion({
          input: {
            id: question.id,
            to: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendQuestion: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendQuestion'],
            }),
          ],
        })
      })
    })
  })

  describe('errors', () => {
    it('cannot amend question if user is not in the sharedWith', async () => {
      const author = await createUser()
      const question = await createQuestion({ author, shareWith: [] })
      const stranger = await createUser()

      const text = faker.lorem.sentence()
      const richText = JSON.parse(faker.datatype.json())

      const response = await mutateAmendQuestion({
        input: {
          id: question.id,
          text,
          richText,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendQuestion'],
          }),
        ],
      })
    })

    it('fails when non existent item id is passed', async () => {
      const response = await mutateAmendQuestion({
        input: {
          id: idFromPrismaToGraphQL(-1, TypeName.ITEM),
        },
        loggedInAs: await createUser(),
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendQuestion'],
          }),
        ],
      })
    })

    it('fails when non question item is passed', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [] })

      const response = await mutateAmendQuestion({
        input: {
          id: task.id,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendQuestion: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendQuestion'],
          }),
        ],
      })
    })
  })
})
