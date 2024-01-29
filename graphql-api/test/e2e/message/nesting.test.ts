import { faker } from '@faker-js/faker'
import createUser from '../drivers/user/create'
import sendMessage, { mutateSendMessage } from '../drivers/message/send'
import { TypeName } from 'src/constants'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import type { User } from 'src/generated/graphql'
import userToPublicUser from '../utils/userToPublicUser'

describe('message nesting', () => {
  it('sends a message with a parent item', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstMessage = await sendMessage({
      author,
      shareWith: [recipient],
    })

    const nestedMessage = await sendMessage({
      author,
      shareWith: [recipient],
      parentId: firstMessage.id,
    })

    expect(nestedMessage).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(recipient),
        ]),
        parentId: firstMessage.id,
      })
    )
    expect(nestedMessage.sharedWith).toHaveLength(2)
  })

  it('takes sharedWith from the parent when shareWith is not provided', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstMessage = await sendMessage({
      author,
      shareWith: [recipient],
    })

    const nestedMessage = await sendMessage({
      author,
      parentId: firstMessage.id,
    })

    expect(nestedMessage).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining(firstMessage.sharedWith),
        parentId: firstMessage.id,
      })
    )
    expect(nestedMessage.sharedWith.length).toBe(firstMessage.sharedWith.length)
  })

  describe('errors', () => {
    it('barred from sending when non item id is passed as parentId', async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateSendMessage({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          shareWith: [{ id: recipient.id }],
          parentId: recipient.id,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          sendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Invalid parentId entity type "User"',
            path: ['sendMessage'],
          }),
        ],
      })
    })

    it('barred from sending when user is not in the parent items sharedWith', async () => {
      const firstUser = await createUser()
      const secondUser = await createUser()

      const parentMessage = await sendMessage({
        author: firstUser,
        shareWith: [],
      })

      const response = await mutateSendMessage({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          parentId: parentMessage.id,
        },
        loggedInAs: secondUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { sendMessage: null },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['sendMessage'],
          }),
        ],
      })
    })

    it('throws when "parentId" is non existent', async () => {
      const author = await createUser()

      const response = await mutateSendMessage({
        input: {
          text: faker.lorem.sentence(),
          richText: JSON.parse(faker.datatype.json()),
          parentId: `${TypeName.ITEM}:-1`,
        },
        loggedInAs: author,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          sendMessage: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['sendMessage'],
          }),
        ],
      })
    })
  })

  it('throws when neither "parentId" nor "shareWith"', async () => {
    const author = await createUser()

    const response = await mutateSendMessage({
      input: {
        text: faker.lorem.sentence(),
        richText: JSON.parse(faker.datatype.json()),
      },
      loggedInAs: author,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        sendMessage: null,
      },
      errors: [
        expect.objectContaining({
          message: 'Must provide one of "parentId" or "shareWith"',
          path: ['sendMessage'],
        }),
      ],
    })
  })
})
