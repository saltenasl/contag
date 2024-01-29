import type { PrismaClient } from '@prisma/client'
import { ITEM_INCLUDE } from './constants'

const getItem = async ({
  prisma,
  id,
}: {
  prisma: PrismaClient
  id: number
}) => {
  const item = await prisma.item.findUnique({
    where: { id },
    include: ITEM_INCLUDE,
  })

  return item
}

export default getItem
