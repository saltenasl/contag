import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import type { User } from 'src/types'

const validateUserIdsShareClientWithCurrentUser = async ({
  prisma,
  currentUser,
  ids,
}: {
  prisma: PrismaClient
  currentUser: User
  ids: number[]
}) => {
  const usersHavingSharedClientsWithCurrentUser =
    await prisma.userClient.findMany({
      distinct: ['userId'],
      where: {
        client: {
          userClients: {
            some: {
              userId: currentUser.id,
            },
          },
        },
        userId: { in: ids },
      },
      include: {
        user: true,
      },
    })

  if (usersHavingSharedClientsWithCurrentUser.length !== ids.length) {
    throw new GraphQLError('Recipient not found')
  }

  return usersHavingSharedClientsWithCurrentUser.map(({ user }) => user)
}

export default validateUserIdsShareClientWithCurrentUser
