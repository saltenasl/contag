import type { PrismaClient } from '@prisma/client'

const getUserByEmailFromClient = async ({
  prisma,
  email,
  clientId,
}: {
  prisma: PrismaClient
  email: string
  clientId: number
}) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      userClients: {
        some: {
          clientId,
        },
      },
    },
  })

  return user
}

export default getUserByEmailFromClient
