import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'
import { ITEM_INCLUDE } from './constants'

const getParentItem = async ({
  prisma,
  parentId,
  currentUser,
}: {
  prisma: PrismaClient
  parentId: number
  currentUser: User
}) => {
  const parentItem = await prisma.item.findFirst({
    where: {
      id: parentId,
      sharedWith: { some: { userId: currentUser.id } },
    },
    include: ITEM_INCLUDE,
  })

  return parentItem
}

export default getParentItem
