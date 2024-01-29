import type { PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'

const deleteItemSummary = async ({
  prisma,
  item,
}: {
  prisma: PrismaClient
  item: GenericItem
}) => {
  if (!item.summary) {
    return item
  }

  const updatedItem = await prisma.item.update({
    where: { id: item.id },
    data: {
      summary: {
        delete: true,
      },
    },
    include: ITEM_INCLUDE,
  })

  return updatedItem
}

export default deleteItemSummary
