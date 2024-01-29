import type { PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from './constants'

const updateItemGoals = async ({
  prisma,
  item,
  goalsAddedIds,
  goalsRemovedIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  goalsAddedIds: number[]
  goalsRemovedIds: number[]
}) => {
  return await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      goals: {
        connect: goalsAddedIds.map((id) => ({ id })),
        disconnect: goalsRemovedIds.map((id) => ({ id })),
      },
    },
    include: ITEM_INCLUDE,
  })
}

export default updateItemGoals
