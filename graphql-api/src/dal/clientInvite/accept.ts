import type { ClientInvites, PrismaClient } from '@prisma/client'
import { ClientRole } from '@prisma/client'

const acceptClientInvite = async ({
  prisma,
  currentUserId,
  invite,
}: {
  prisma: PrismaClient
  currentUserId: number
  invite: ClientInvites
}) => {
  const [__, userClient] = await prisma.$transaction([
    prisma.clientInvites.delete({
      where: {
        id: invite.id,
      },
    }),
    prisma.userClient.create({
      data: {
        user: {
          connect: {
            id: currentUserId,
          },
        },
        client: {
          connect: {
            id: invite.clientId,
          },
        },
        role: ClientRole.MEMBER,
        addedBy: {
          connect: {
            id: invite.createdByUserId,
          },
        },
      },
      include: {
        client: true,
        addedBy: true,
      },
    }),
  ])

  return userClient
}

export default acceptClientInvite
