import { faker } from '@faker-js/faker'
import createUser from './drivers/user/create'
import inviteToClient, {
  mutateInviteToClient,
} from './drivers/clientInvites/create'
import acceptClientInvite, {
  mutateAcceptClientInvite,
} from './drivers/clientInvites/accept'
import getClientInvites from './drivers/clientInvites/get'
import getUser from './drivers/user/get'
import { mutateDeclineClientInvite } from './drivers/clientInvites/decline'
import { UserClientRole } from 'src/generated/graphql'
import { TypeName } from 'src/constants'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'

describe('client invite', () => {
  describe('invite email to client', () => {
    it('invites email to a client', async () => {
      const email = faker.internet.email()
      const user = await createUser()

      const response = await mutateInviteToClient({
        input: { clientId: user.clients[0]?.id as string, email },
        loggedInAs: user,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          inviteToClient: {
            id: expect.any(String),
            client: {
              id: user.clients[0]?.id,
              name: user.clients[0]?.name,
            },
            email,
            invitedBy: {
              email: user.email,
            },
          },
        },
      })
    })

    it('invites email to a client is idempotent', async () => {
      const user = await createUser()

      const firstInvite = await inviteToClient({
        clientId: user.clients[0]?.id as string,
        loggedInAs: user,
      })

      const secondInvite = await inviteToClient({
        clientId: user.clients[0]?.id as string,
        email: firstInvite.email,
        loggedInAs: user,
      })

      expect(firstInvite).toStrictEqual(secondInvite)
    })

    describe('errors', () => {
      it('fails when user is already in the organization', async () => {
        const user = await createUser()

        const response = await mutateInviteToClient({
          input: { clientId: user.clients[0]?.id as string, email: user.email },
          loggedInAs: user,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            inviteToClient: null,
          },
          errors: [
            expect.objectContaining({
              message: 'User is already in the client',
              path: ['inviteToClient'],
            }),
          ],
        })
      })

      it('user is not a member of the client that he is trying to invite an email to', async () => {
        const email = faker.internet.email()

        const firstUser = await createUser()
        const secondUser = await createUser()

        const response = await mutateInviteToClient({
          input: {
            clientId: firstUser.clients[0]?.id as string,
            email,
          },
          loggedInAs: secondUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            inviteToClient: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Unauthorized',
              path: ['inviteToClient'],
            }),
          ],
        })
      })

      it(`users role is ${UserClientRole.Member}`, async () => {
        const toBeInvitedMemberEmail = faker.internet.email()

        const clientOwnerUser = await createUser()
        const clientMemberUser = await createUser()
        const invite = await inviteToClient({
          clientId: clientOwnerUser.clients[0]?.id as string,
          email: clientMemberUser.email,
          loggedInAs: clientOwnerUser,
        })

        const membersClient = await acceptClientInvite({
          inviteId: invite.id,
          loggedInAs: clientMemberUser,
        })

        expect(membersClient.role).toBe(UserClientRole.Member)

        const response = await mutateInviteToClient({
          input: {
            clientId: clientOwnerUser.clients[0]?.id as string,
            email: toBeInvitedMemberEmail,
          },
          loggedInAs: clientMemberUser,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: {
            inviteToClient: null,
          },
          errors: [
            expect.objectContaining({
              message: 'Unauthorized',
              path: ['inviteToClient'],
            }),
          ],
        })
      })
    })
  })

  describe('query client invites', () => {
    it('returns empty array when there are no invites', async () => {
      const user = await createUser()

      const clientInvites = await getClientInvites({ loggedInAs: user })

      expect(clientInvites).toStrictEqual([])
    })

    it('returns client invite', async () => {
      const user = await createUser()
      const toBeInvitedUser = await createUser()

      const clientInvite = await inviteToClient({
        clientId: user.clients[0]?.id as string,
        email: toBeInvitedUser.email,
        loggedInAs: user,
      })

      const clientInvites = await getClientInvites({
        loggedInAs: toBeInvitedUser,
      })

      expect(clientInvites).toStrictEqual([clientInvite])
    })
  })

  describe('accept client invite', () => {
    it('accepts client invite', async () => {
      const user = await createUser()
      const toBeInvitedUser = await createUser()

      const clientInvite = await inviteToClient({
        clientId: user.clients[0]?.id as string,
        email: toBeInvitedUser.email,
        loggedInAs: user,
      })

      const response = await mutateAcceptClientInvite({
        inviteId: clientInvite.id,
        loggedInAs: toBeInvitedUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          acceptClientInvite: {
            id: expect.any(String),
            name: user.clients[0]?.name,
            role: UserClientRole.Member,
            addedBy: {
              email: user.email,
            },
          },
        },
      })

      const clientInvites = await getClientInvites({
        loggedInAs: toBeInvitedUser,
      })

      expect(clientInvites).not.toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: clientInvite.client.id }),
        ])
      )

      const updatedUser = await getUser({ loggedInAs: toBeInvitedUser })

      expect(updatedUser.clients).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: clientInvite.client.id,
            role: UserClientRole.Member,
            addedBy: { email: user.email },
          }),
        ])
      )
    })

    describe('errors', () => {
      it('fails when non existent invite id is passed', async () => {
        const user = await createUser()

        const response = await mutateAcceptClientInvite({
          inviteId: 'InviteToClient:-1',
          loggedInAs: user,
        })

        const body = await response.json()

        expect(body).toStrictEqual(
          expect.objectContaining({
            errors: expect.arrayContaining([
              expect.objectContaining({
                message: 'Invite not found',
                path: ['acceptClientInvite'],
              }),
            ]),
          })
        )
      })

      it('fails when other users invite id is passed', async () => {
        const user = await createUser()
        const toBeInvitedUser = await createUser()

        const clientInvite = await inviteToClient({
          clientId: user.clients[0]?.id as string,
          email: toBeInvitedUser.email,
          loggedInAs: user,
        })

        const response = await mutateAcceptClientInvite({
          inviteId: clientInvite.id,
          loggedInAs: user,
        })

        const body = await response.json()

        expect(body).toStrictEqual(
          expect.objectContaining({
            errors: expect.arrayContaining([
              expect.objectContaining({
                message: 'Invite not found',
                path: ['acceptClientInvite'],
              }),
            ]),
          })
        )
      })
    })
  })

  describe('decline client invite', () => {
    it('declines client invite', async () => {
      const user = await createUser()
      const toBeInvitedUser = await createUser()

      const clientInvite = await inviteToClient({
        clientId: user.clients[0]?.id as string,
        email: toBeInvitedUser.email,
        loggedInAs: user,
      })

      const response = await mutateDeclineClientInvite({
        inviteId: clientInvite.id,
        loggedInAs: toBeInvitedUser,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          declineClientInvite: {
            success: true,
            message: null,
          },
        },
      })

      const clientInvites = await getClientInvites({
        loggedInAs: toBeInvitedUser,
      })

      expect(clientInvites).not.toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: clientInvite.client.id }),
        ])
      )

      const updatedUser = await getUser({ loggedInAs: toBeInvitedUser })

      expect(updatedUser.clientInvites).not.toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: clientInvite.id }),
        ])
      )
    })

    it('fails when non existent invite id is passed', async () => {
      const user = await createUser()

      const response = await mutateDeclineClientInvite({
        inviteId: idFromPrismaToGraphQL(-1, TypeName.INVITE_TO_CLIENT),
        loggedInAs: user,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: { declineClientInvite: null },
        errors: [
          expect.objectContaining({
            message: 'Invite not found',
            path: ['declineClientInvite'],
          }),
        ],
      })
    })

    describe('errors', () => {
      it('fails when other users invite id is passed', async () => {
        const user = await createUser()
        const toBeInvitedUser = await createUser()

        const clientInvite = await inviteToClient({
          clientId: user.clients[0]?.id as string,
          email: toBeInvitedUser.email,
          loggedInAs: user,
        })

        const response = await mutateDeclineClientInvite({
          inviteId: clientInvite.id,
          loggedInAs: user,
        })

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body).toStrictEqual({
          data: { declineClientInvite: null },
          errors: [
            expect.objectContaining({
              message: 'Invite not found',
              path: ['declineClientInvite'],
            }),
          ],
        })
      })
    })
  })
})
