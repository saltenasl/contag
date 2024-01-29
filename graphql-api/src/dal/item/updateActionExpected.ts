import type { Prisma } from '@prisma/client'
import type { GenericItem } from 'src/types'

const updateActionExpectation = async ({
  prisma,
  item,
  actionExpectation,
}: {
  prisma: Prisma.TransactionClient
  item: GenericItem
  actionExpectation: { completeUntil?: Date | null } | null | undefined
}) => {
  if (!actionExpectation) {
    return
  }

  await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      actionExpectation: {
        upsert: {
          create: actionExpectation,
          update: actionExpectation,
        },
      },
    },
  })
}

export default updateActionExpectation
