import type { PrismaClient } from '@prisma/client'
import {
  VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS,
  VIEWING_FEED_POLL_INTERVAL_MS,
} from 'src/constants'
import toFullTextSearchTerm from '../utils/toFullTextSearchTerm'

const listUsersFromClients = async ({
  prisma,
  currentUserId,
  clientIds,
  search,
}: {
  prisma: PrismaClient
  currentUserId: number
  clientIds: number[]
  search?: string | null | undefined
}) => {
  const users = await prisma.user.findMany({
    where: {
      userClients: { some: { clientId: { in: clientIds } } },
      id: { not: currentUserId },
      ...(search ? { name: { search: toFullTextSearchTerm(search) } } : {}),
    },
    include: {
      usersFeedActivity: {
        where: { parentUserId: currentUserId },
      },
    },
  })

  return users.map((user) => ({
    ...user,
    active: user.usersFeedActivity.some(
      ({ lastActivity }) =>
        lastActivity.getTime() >=
        new Date().getTime() -
          (VIEWING_FEED_POLL_INTERVAL_MS +
            VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS)
    ),
  }))
}

export default listUsersFromClients
