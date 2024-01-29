import type { User } from 'src/generated/graphql'
import acceptClientInvite from './drivers/clientInvites/accept'
import inviteToClient from './drivers/clientInvites/create'
import getPublicUsers, { queryPublicUsers } from './drivers/publicUsers/get'
import createUser from './drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from './drivers/user/createMultipleAndAddToClient'

describe('query publicUsers', () => {
  it('always returns self', async () => {
    const user = await createUser()
    const response = await queryPublicUsers({
      loggedInAs: user,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        publicUsers: [
          {
            id: user.id,
            email: user.email,
            name: user.name,
            photoURL: user.photoURL,
            active: true,
          },
        ],
      },
    })
  })

  it('users from my client', async () => {
    const firstUser = await createUser()
    const secondUser = await createUser()

    const { id: inviteId } = await inviteToClient({
      clientId: firstUser.clients[0]?.id as string,
      email: secondUser.email,
      loggedInAs: firstUser,
    })

    await acceptClientInvite({ inviteId, loggedInAs: secondUser })

    const response = await queryPublicUsers({
      loggedInAs: firstUser,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        publicUsers: [
          {
            id: firstUser.id,
            email: firstUser.email,
            name: firstUser.name,
            photoURL: firstUser.photoURL,
            active: true,
          },
          {
            id: secondUser.id,
            email: secondUser.email,
            name: secondUser.name,
            photoURL: secondUser.photoURL,
            active: false,
          },
        ],
      },
    })
  })

  it('users from multiple clients', async () => {
    await createUser() // stranger which shouldn't appear in the response

    const { clientAdminUser: firstUser, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const secondUser = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    const response = await queryPublicUsers({
      loggedInAs: firstUser,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        publicUsers: expect.arrayContaining([
          {
            id: firstUser.id,
            email: firstUser.email,
            name: firstUser.name,
            photoURL: firstUser.photoURL,
            active: true,
          },
          {
            id: secondUser.id,
            email: secondUser.email,
            name: secondUser.name,
            photoURL: secondUser.photoURL,
            active: false,
          },
          {
            id: thirdUser.id,
            email: thirdUser.email,
            name: thirdUser.name,
            photoURL: thirdUser.photoURL,
            active: false,
          },
        ]),
      },
    })
    expect(body.data.publicUsers).toHaveLength(3)
  })

  it('always returns self first', async () => {
    const { clientAdminUser: firstUser, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(3)
    const secondUser = clientMemberUsers[0] as User
    const thirdUser = clientMemberUsers[1] as User

    await Promise.all(
      [firstUser, secondUser, thirdUser].map(async (user) => {
        const publicUsers = await getPublicUsers({
          loggedInAs: user,
        })

        expect(publicUsers[0]).toStrictEqual({
          id: user.id,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          active: true,
        })
      })
    )
  })

  it('search by name', async () => {
    const { clientAdminUser: loggedInAs, clientMemberUsers } =
      await createMultipleUsersAndAddToTheSameClient(4)
    const wantedUser = clientMemberUsers[0] as User

    const publicUsers = await getPublicUsers({
      loggedInAs,
      filters: {
        search: (wantedUser.name as string).substring(
          0,
          (wantedUser.name as string).length - 3
        ),
      },
    })

    expect(publicUsers).toStrictEqual([
      {
        id: wantedUser.id,
        email: wantedUser.email,
        name: wantedUser.name,
        photoURL: wantedUser.photoURL,
        active: false,
      },
    ])
  })

  it("doesn't fail when searching for item url", async () => {
    const loggedInAs = await createUser()

    const publicUsers = await getPublicUsers({
      loggedInAs,
      filters: {
        search: `https://contagapp.com/item/Item:142`,
      },
    })

    expect(publicUsers).toStrictEqual([])
  })
})
