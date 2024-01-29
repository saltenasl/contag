import type { PrismaClient } from '@prisma/client'
import { ItemType } from 'src/generated/graphql'
import type { GenericItem } from 'src/types'
import convertToMessage from './toMessage'
import convertToQuestion from './toQuestion'
import convertToTask from './toTask'
import convertToInfo from './toInfo'
import convertToGoal from './toGoal'

const convertItem = async ({
  prisma,
  item,
  to,
}: {
  prisma: PrismaClient
  item: GenericItem
  to: ItemType
}): Promise<GenericItem> => {
  switch (to) {
    case ItemType.Message:
      return await convertToMessage({ item, prisma })
    case ItemType.Task:
      return await convertToTask({ item, prisma })

    case ItemType.Question:
      return await convertToQuestion({ item, prisma })

    case ItemType.Info:
      return await convertToInfo({ item, prisma })

    case ItemType.Goal:
      return await convertToGoal({ item, prisma })

    default:
      throw new Error(
        `Unknown type to convert to, converting item ${item.id} to ${to}`
      )
  }
}

export default convertItem
