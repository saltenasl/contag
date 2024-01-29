import type { PrismaClient } from '@prisma/client'

const listClientInvites = async ({
  prisma,
  email,
}: {
  prisma: PrismaClient
  email: string
}) => {
  const clientInvites = await prisma.clientInvites.findMany({
    where: { email },
    include: {
      client: true,
      createdBy: true,
    },
  })

  return clientInvites
}

export default listClientInvites
