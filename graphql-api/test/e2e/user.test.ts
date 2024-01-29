import { DEFAULT_CLIENT_NAME } from 'src/constants'
import { UserClientRole } from 'src/generated/graphql'
import createUser from './drivers/user/create'
import { queryUser } from './drivers/user/get'
import loggedInUserFactory from './utils/factories/loggedInUser'

describe('user', () => {
  it('creates user profile on the fly with all fields', async () => {
    const loggedInAs = loggedInUserFactory.build()

    const user = await createUser({ loggedInAs })

    expect(user).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String),
        email: loggedInAs.email,
        name: loggedInAs.name,
        photoURL: loggedInAs.picture,
        clients: [
          {
            id: expect.any(String),
            name: `${loggedInAs.name} ${DEFAULT_CLIENT_NAME}`,
            addedBy: null,
            role: UserClientRole.Owner,
          },
        ],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    )
  })

  it('retrieves user information', async () => {
    const user = await createUser()

    const response = await queryUser({ loggedInAs: user })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: { myProfile: user },
    })
  })
})
