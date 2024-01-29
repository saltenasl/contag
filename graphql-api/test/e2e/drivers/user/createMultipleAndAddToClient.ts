import type { User } from 'src/generated/graphql'
import acceptClientInvite from '../clientInvites/accept'
import inviteToClient from '../clientInvites/create'
import createUser from './create'

const createMultipleUsersAndAddToTheSameClient = async (
  numberOfUsersToCreate: number
): Promise<{
  clientAdminUser: User
  clientMemberUsers: User[]
}> => {
  if (numberOfUsersToCreate < 2) {
    throw new Error('Cannot create less than two users')
  }

  const clientAdminUser = await createUser()
  const clientId = clientAdminUser.clients[0]?.id as string

  const clientMemberUsers = await Promise.all(
    Array.from({ length: numberOfUsersToCreate - 1 }).map(async () => {
      const user = await createUser()

      const clientInvite = await inviteToClient({
        clientId,
        loggedInAs: clientAdminUser,
        email: user.email,
      })

      await acceptClientInvite({ inviteId: clientInvite.id, loggedInAs: user })

      return user
    })
  )

  return { clientAdminUser, clientMemberUsers }
}

export default createMultipleUsersAndAddToTheSameClient
