import type { PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from './constants'

const updateItemsBlocked = async ({
  prisma,
  item,
  blockedByAddedIds,
  blockedByRemovedIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  blockedByAddedIds: number[]
  blockedByRemovedIds: number[]
}) => {
  const updatedItem = await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      isBlockedBy: {
        connect: blockedByAddedIds.map((id) => ({ id })),
        disconnect: blockedByRemovedIds.map((id) => ({ id })),
      },
    },
    include: ITEM_INCLUDE,
  })

  return updatedItem
}

export default updateItemsBlocked
