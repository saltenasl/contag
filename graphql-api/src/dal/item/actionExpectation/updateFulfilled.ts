import type { PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'

const updateActionExpectationFulfilled = async ({
  fulfilled,
  item,
  prisma,
}: {
  fulfilled: boolean
  item: Omit<GenericItem, 'actionExpectation'> & {
    actionExpectation: NonNullable<GenericItem['actionExpectation']>
  }
  prisma: PrismaClient
}) => {
  await prisma.actionExpectation.update({
    where: {
      id: item.actionExpectation.id,
    },
    data: {
      fulfilled,
    },
  })
}

export default updateActionExpectationFulfilled
