import type { PrismaClient } from '@prisma/client'
import type { Item } from 'src/types'

const updateGoalConstituents = async ({
  prisma,
  item,
  constituentsAddedIds,
  constituentsRemovedIds,
}: {
  prisma: PrismaClient
  item: Item<'goal'>
  constituentsAddedIds: number[]
  constituentsRemovedIds: number[]
}) => {
  const goal = await prisma.goal.update({
    where: {
      id: item.goal.id,
    },
    data: {
      constituents: {
        connect: constituentsAddedIds.map((id) => ({ id })),
        disconnect: constituentsRemovedIds.map((id) => ({ id })),
      },
    },
    include: { constituents: true },
  })

  return goal
}

export default updateGoalConstituents
