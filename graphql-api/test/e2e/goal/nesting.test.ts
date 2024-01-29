import { faker } from '@faker-js/faker'
import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import createGoal, { mutateCreateGoal } from '../drivers/goal/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import userToPublicUser from '../utils/userToPublicUser'

describe('nesting', () => {
  it('creates a goal with a parent item', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstGoal = await createGoal({
      author,
      shareWith: [recipient],
    })

    const nestedGoal = await createGoal({
      author,
      shareWith: [recipient],
      parentId: firstGoal.id,
    })

    expect(nestedGoal).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining([
          userToPublicUser(author),
          userToPublicUser(recipient),
        ]),
        parentId: firstGoal.id,
      })
    )
    expect(nestedGoal.sharedWith).toHaveLength(2)
  })

  it('takes sharedWith from the parent when not provided', async () => {
    const { clientAdminUser: author, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(2)
    const recipient = clientMemberUsers[0] as User

    const firstGoal = await createGoal({
      author,
      shareWith: [recipient],
    })

    const nestedGoal = await createGoal({
      author,
      parentId: firstGoal.id,
    })

    expect(nestedGoal).toStrictEqual(
      expect.objectContaining({
        sharedWith: expect.arrayContaining(firstGoal.sharedWith),
        parentId: firstGoal.id,
      })
    )
    expect(nestedGoal.sharedWith.length).toBe(firstGoal.sharedWith.length)
  })

  describe('errors', () => {
    it('throws an error when non item id is passed as parentId', async () => {
      const author = await createUser()
      const recipient = await createUser()

      const response = await mutateCreateGoal({
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
          createGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Invalid parentId entity type "User"',
            path: ['createGoal'],
          }),
        ],
      })
    })

    it('throws when neither "parentId", "shareWith", nor "to" is passed', async () => {
      const author = await createUser()

      const response = await mutateCreateGoal({
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
          createGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Must provide one of "parentId", "shareWith" or "to"',
            path: ['createGoal'],
          }),
        ],
      })
    })

    it('throws when "parentId" is non existent', async () => {
      const author = await createUser()

      const response = await mutateCreateGoal({
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
          createGoal: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['createGoal'],
          }),
        ],
      })
    })

    it('barred from creation when user is not in the parent items sharedWith', async () => {
      const firstUser = await createUser()
      const secondUser = await createUser()

      const parentMessage = await createGoal({
        author: firstUser,
        shareWith: [firstUser],
      })

      const response = await mutateCreateGoal({
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
        data: { createGoal: null },
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['createGoal'],
          }),
        ],
      })
    })
  })
})
