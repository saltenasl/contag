import type { PrismaClient } from '@prisma/client'

const saveClientInvite = async ({
  prisma,
  email,
  clientId,
  currentUserId,
}: {
  prisma: PrismaClient
  email: string
  clientId: number
  currentUserId: number
}) => {
  const invite = await prisma.clientInvites.upsert({
    where: {
      email_clientId: { email, clientId },
    },
    create: {
      email,
      clientId,
      createdByUserId: currentUserId,
    },
    update: {},
    include: {
      client: true,
    },
  })

  return invite
}

export default saveClientInvite
