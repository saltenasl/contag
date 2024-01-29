import type { PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from './constants'

const updateItemsBlocked = async ({
  prisma,
  item,
  itemsBlockedAddedIds,
  itemsBlockedRemovedIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  itemsBlockedAddedIds: number[]
  itemsBlockedRemovedIds: number[]
}) => {
  const updatedItem = await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      blocks: {
        connect: itemsBlockedAddedIds.map((id) => ({ id })),
        disconnect: itemsBlockedRemovedIds.map((id) => ({ id })),
      },
    },
    include: ITEM_INCLUDE,
  })

  return updatedItem
}

export default updateItemsBlocked
