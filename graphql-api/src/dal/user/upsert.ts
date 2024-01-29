import type { PrismaClient } from '@prisma/client'
import { ClientRole } from '@prisma/client'
import { DEFAULT_CLIENT_NAME } from 'src/constants'

const upsertUser = async ({
  email,
  picture,
  name,
  prisma,
}: {
  email: string
  picture?: string | undefined
  name?: string | undefined
  prisma: PrismaClient
}) => {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      photoURL: picture || null,
      name: name || null,
      userClients: {
        create: {
          role: ClientRole.OWNER,
          client: {
            create: { name: `${name || email} ${DEFAULT_CLIENT_NAME}` },
          },
        },
      },
    },
    include: {
      userClients: { include: { client: true, addedBy: true } },
    },
    update: {},
  })

  return user
}

export default upsertUser
