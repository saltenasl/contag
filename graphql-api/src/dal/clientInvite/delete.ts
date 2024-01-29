import type { PrismaClient } from '@prisma/client'

const deleteClientInvite = async ({
  prisma,
  id,
}: {
  prisma: PrismaClient
  id: number
}) => {
  await prisma.clientInvites.delete({
    where: {
      id,
    },
  })
}

export default deleteClientInvite
