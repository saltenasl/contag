import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import type { Client, User } from 'src/generated/graphql'
import { TaskStatus } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import createTask from '../drivers/task/create'
import amendTask, { mutateAmendTask } from '../drivers/task/amend'
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
  it('amends todo task status to done', async () => {
    const author = await createUser()

    const task = await createTask({ author, shareWith: [] })

    expect(task.status).toBe(TaskStatus.Todo)

    const response = await mutateAmendTask({
      input: {
        id: task.id,
        status: TaskStatus.Done,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendTask: expect.objectContaining({
          id: task.id,
          status: TaskStatus.Done,
        }),
      },
    })
  })

  it('allows another user in the same client to amend status', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const anotherUser = clientMemberUsers[0] as User

    const task = await createTask({
      author,
      shareWith: [anotherUser],
    })

    expect(task.status).toBe(TaskStatus.Todo)

    const response = await mutateAmendTask({
      input: {
        id: task.id,
        status: TaskStatus.Done,
      },
      loggedInAs: anotherUser,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendTask: expect.objectContaining({
          id: task.id,
          status: TaskStatus.Done,
        }),
      },
    })
  })

  it('amend task status is idempotent', async () => {
    const author = await createUser()
    const task = await createTask({ author, shareWith: [] })

    const firstUpdateResponseBody = await amendTask({
      author,
      id: task.id,
      status: TaskStatus.Done,
    })

    const secondUpdateResponseBody = await amendTask({
      author,
      id: task.id,
      status: TaskStatus.Done,
    })

    expect(secondUpdateResponseBody).toStrictEqual({
      ...firstUpdateResponseBody,
      updatedAt: expect.any(String),
    })
  })

  it('author amends tasks description', async () => {
    const author = await createUser()
    const task = await createTask({ author, shareWith: [] })

    const text = faker.lorem.sentence()
    const richText = JSON.parse(faker.datatype.json())

    const response = await mutateAmendTask({
      input: {
        id: task.id,
        text,
        richText,
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        amendTask: {
          ...task,
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
      const task = await createTask({ author, shareWith: [] })

      expect(task.to).toStrictEqual([])

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [{ id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
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

      const task = await createTask({ author, to: [author] })

      expect(task.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [{ id: author.id }, { id: otherUser.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
            to: expect.arrayContaining([
              userToPublicUser(author),
              userToPublicUser(otherUser),
            ]),
            sharedWith: expect.arrayContaining([userToPublicUser(otherUser)]),
          }),
        },
      })
      expect(body.data.amendTask.to).toHaveLength(2)
    })

    it('removes from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const task = await createTask({ author, to: [author, otherUser] })

      expect(task.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(task.to).toHaveLength(2)

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
            to: [userToPublicUser(author)],
          }),
        },
      })
    })

    it('removes all from existing list', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const task = await createTask({ author, to: [author, otherUser] })

      expect(task.to).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(task.to).toHaveLength(2)

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
            to: [],
          }),
        },
      })
    })

    it('keeps the same', async () => {
      const author = await createUser()

      const task = await createTask({ author, to: [author] })

      expect(task.to).toStrictEqual([userToPublicUser(author)])

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [{ id: author.id }],
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
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

      const task = await createTask({
        author,
        to: [otherUser],
        shareWith: [stranger],
      })

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          to: [{ id: otherUser.id }, { id: stranger.id }],
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: expect.objectContaining({
            id: task.id,
            to: expect.arrayContaining([
              userToPublicUser(otherUser),
              userToPublicUser(stranger),
            ]),
          }),
        },
      })
      expect(body.data.amendTask.to).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const task = await createTask({ author, to: [] })

        const response = await mutateAmendTask({
          input: {
            id: task.id,
            to: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendTask: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendTask'],
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
      const task = await createTask({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const anotherFile = await createFile({ loggedInAs: author })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        attachments: [{ id: file.id }, { id: anotherFile.id }],
      })

      expect(updatedTask).toStrictEqual(
        expect.objectContaining({
          id: task.id,
          attachments: expect.arrayContaining([file, anotherFile]),
        })
      )
      expect(updatedTask.attachments).toHaveLength(2)
    })

    it('adds an attachment - allows read access to all the people that are in shareWith', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(3)
      const someOtherUser = clientMemberUsers[0] as User
      const anotherUser = clientMemberUsers[1] as User

      const task = await createTask({
        author,
        shareWith: [someOtherUser, anotherUser],
        attachments: [],
      })

      const file = await createFile({ loggedInAs: author })

      await amendTask({
        id: task.id,
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
      const task = await createTask({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        attachments: [],
      })

      expect(updatedTask).toStrictEqual(
        expect.objectContaining({
          id: task.id,
          attachments: [],
        })
      )
    })

    it('removes an attachment - removes all accesses from all the people that are in shareWith', async () => {
      const author = await createUser()
      const file = await createFile({ loggedInAs: author })

      const task = await createTask({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendTask({
        id: task.id,
        author,
        attachments: [],
      })

      expect(removeAllAccessToFile).toHaveBeenCalledWith({
        filename: file.filename,
      })
    })

    it('another user amends task and keeps the same attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const task = await createTask({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        attachments: [{ id: file.id }],
      })

      expect(updatedTask).toStrictEqual(
        expect.objectContaining({
          id: task.id,
          attachments: [file],
        })
      )
    })

    it('removes attachment created by another user', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const task = await createTask({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const updatedTask = await amendTask({
        id: task.id,
        author,
        attachments: [],
      })

      expect(updatedTask).toStrictEqual(
        expect.objectContaining({
          id: task.id,
          attachments: [],
        })
      )
    })

    it('adds attachment to a list of attachments added by other users', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const task = await createTask({
        author,
        shareWith: [anotherUser],
        attachments: [{ id: file.id }],
      })

      const anotherUsersFile = await createFile({ loggedInAs: anotherUser })

      const updatedTask = await amendTask({
        id: task.id,
        author: anotherUser,
        attachments: [{ id: file.id }, { id: anotherUsersFile.id }],
      })

      expect(updatedTask).toStrictEqual(
        expect.objectContaining({
          id: task.id,
          attachments: expect.arrayContaining([file, anotherUsersFile]),
        })
      )
      expect(updatedTask.attachments).toHaveLength(2)
    })

    it('user adds another assignee when item has attachments', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const anotherUser = clientMemberUsers[0] as User
      const file = await createFile({ loggedInAs: author })

      const info = await createTask({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      await amendTask({
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
      const task = await createTask({
        author,
        shareWith: [],
        attachments: [{ id: file.id }],
      })

      expect(allowUserAccessToFile).not.toHaveBeenCalledWith({
        operations: ['read'],
        userEmail: otherUser.email,
        filename: file.filename,
      })

      await amendTask({
        author,
        id: task.id,
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
      const task = await createTask({
        author,
        shareWith: [otherUser],
        attachments: [{ id: file.id }],
      })

      expect(removeUserAccessToFile).not.toHaveBeenCalledWith({
        filename: file.filename,
        userEmail: otherUser.email,
      })

      await amendTask({
        author,
        id: task.id,
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
        const task = await createTask({ author, shareWith: [] })

        const response = await mutateAmendTask({
          loggedInAs: author,
          input: {
            id: task.id,
            attachments: [{ id: 'File:-1' }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendTask: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendTask'],
            }),
          ],
        })
      })

      it('cannot attach a file which was not created by the current user', async () => {
        const file = await createFile({ loggedInAs: await createUser() })
        const author = await createUser()
        const task = await createTask({ author, shareWith: [] })

        const response = await mutateAmendTask({
          loggedInAs: author,
          input: {
            id: task.id,
            attachments: [{ id: file.id }],
          },
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendTask: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Attachment(s) not found',
              path: ['amendTask'],
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

      const task = await createTask({ author, shareWith: [] })
      expect(task.sharedWith).toHaveLength(1)

      const updatedTask = await amendTask({
        author,
        id: task.id,
        sharedWith: [author, otherUser],
      })

      expect(updatedTask.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedTask.sharedWith).toHaveLength(2)
    })

    it('removes existing', async () => {
      const { clientAdminUser: author, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const otherUser = clientMemberUsers[0] as User

      const task = await createTask({ author, shareWith: [otherUser] })
      expect(task.sharedWith).toHaveLength(2)

      const updatedTask = await amendTask({
        author,
        id: task.id,
        sharedWith: [author],
      })

      expect(updatedTask.sharedWith).toStrictEqual(
        expect.arrayContaining([userToPublicUser(author)])
      )
      expect(updatedTask.sharedWith).toHaveLength(1)
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

      const task = await createTask({
        author: secondUser,
        shareWith: [firstUser, secondUser, thirdUser],
      })

      const updatedTask = await amendTask({
        id: task.id,
        sharedWith: [firstUser, secondUser, thirdUser, fourthUser],
        author: thirdUser,
      })

      expect(updatedTask.sharedWith).toHaveLength(4)
      expect(updatedTask.sharedWith).toStrictEqual(
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

      const task = await createTask({ author, shareWith: [] })
      expect(task.sharedWith).toHaveLength(1)

      const updatedTask = await amendTask({
        author,
        id: task.id,
        to: [otherUser],
        sharedWith: [author, otherUser],
      })

      expect(updatedTask.sharedWith).toStrictEqual(
        expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(otherUser),
        ])
      )
      expect(updatedTask.to).toStrictEqual([userToPublicUser(otherUser)])
      expect(updatedTask.sharedWith).toHaveLength(2)
    })

    describe('errors', () => {
      it("returns recipient not found when recipient doesn't share a client with current user", async () => {
        const author = await createUser()
        const stranger = await createUser()

        const task = await createTask({ author, shareWith: [] })

        const response = await mutateAmendTask({
          input: {
            id: task.id,
            sharedWith: [{ id: stranger.id }],
          },
          loggedInAs: author,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            amendTask: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Recipient not found',
              path: ['amendTask'],
            }),
          ],
        })
      })
    })
  })

  describe('errors', () => {
    it('cannot amend task if user is not in the sharedWith', async () => {
      const author = await createUser()
      const task = await createTask({ author, shareWith: [] })
      const text = faker.lorem.sentence()
      const richText = JSON.parse(faker.datatype.json())
      const stranger = await createUser()

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          text,
          richText,
        },
        loggedInAs: stranger,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendTask'],
          }),
        ],
      })
    })

    it('returns task not found when non-existent task id is passed', async () => {
      const author = await createUser()

      const response = await mutateAmendTask({
        input: {
          id: idFromPrismaToGraphQL(-1, TypeName.ITEM),
          status: TaskStatus.Done,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendTask'],
          }),
        ],
      })
    })

    it('returns task not found when updating task which sharedWith doesnt include current user', async () => {
      const author = await createUser()
      const anotherUser = await createUser()

      const task = await createTask({ author, shareWith: [] })

      const response = await mutateAmendTask({
        input: {
          id: task.id,
          status: TaskStatus.Done,
        },
        loggedInAs: anotherUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          amendTask: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['amendTask'],
          }),
        ],
      })
    })
  })
})
