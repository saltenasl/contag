import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'

const getUser = async ({
  prisma,
  id,
  currentUser,
}: {
  prisma: PrismaClient
  id: number
  currentUser: User
}) => {
  const currentUserClientIds = currentUser.userClients.map(
    ({ clientId }) => clientId
  )

  const user = await prisma.user.findFirst({
    where: {
      id,
      userClients: {
        some: {
          clientId: {
            in: currentUserClientIds,
          },
        },
      },
    },
  })

  return user
}

export default getUser
