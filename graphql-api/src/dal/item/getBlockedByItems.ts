import type { PrismaClient } from '@prisma/client'
import { ITEM_INCLUDE } from './constants'

const getBlockedByItems = async ({
  prisma,
  id,
  currentUserId,
}: {
  prisma: PrismaClient
  id: number
  currentUserId: number
}) => {
  const items = await prisma.item.findMany({
    where: {
      sharedWith: {
        some: {
          userId: currentUserId,
        },
      },
      blocks: {
        some: { id },
      },
    },
    include: ITEM_INCLUDE,
  })

  return items
}

export default getBlockedByItems
