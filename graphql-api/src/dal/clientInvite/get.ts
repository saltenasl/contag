import type { PrismaClient } from '@prisma/client'

const getClientInvite = async ({
  prisma,
  id,
}: {
  prisma: PrismaClient
  id: number
}) => {
  const invite = await prisma.clientInvites.findUnique({
    where: {
      id,
    },
  })

  return invite
}

export default getClientInvite
