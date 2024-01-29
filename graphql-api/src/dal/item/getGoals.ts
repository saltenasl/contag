import type { PrismaClient } from '@prisma/client'
import type { GenericItem, Item } from 'src/types'
import { ITEM_INCLUDE } from './constants'

const getItemGoals = async ({
  prisma,
  id,
  currentUserId,
}: {
  prisma: PrismaClient
  id: number
  currentUserId: number
}) => {
  const goals = await prisma.goal.findMany({
    where: {
      constituents: {
        some: { id },
      },
      item: {
        sharedWith: {
          some: {
            userId: currentUserId,
          },
        },
      },
    },
    include: {
      item: {
        include: ITEM_INCLUDE,
      },
    },
  })

  return goals
    .map(({ item }) => item)
    .filter(<T>(item: T | null): item is T => item !== null)
    .filter((item: GenericItem): item is Item<'goal'> => item.goal !== null)
}

export default getItemGoals
