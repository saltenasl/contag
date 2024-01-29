import type { PrismaClient } from '@prisma/client'
import { ITEM_INCLUDE } from './constants'

const getBlockedItems = async ({
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
      isBlockedBy: {
        some: { id },
      },
    },
    include: ITEM_INCLUDE,
  })

  return items
}

export default getBlockedItems
