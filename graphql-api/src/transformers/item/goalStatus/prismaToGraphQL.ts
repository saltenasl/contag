import { GoalStatus as PrismaGoalStatus } from '@prisma/client'
import { GoalStatus } from 'src/generated/graphql'

const prismaGoalStatusToGraphQL = (status: PrismaGoalStatus): GoalStatus => {
  switch (status) {
    case PrismaGoalStatus.TODO:
      return GoalStatus.Todo
    case PrismaGoalStatus.DONE:
      return GoalStatus.Done
    default:
      throw new Error(`Unknown Goal Status "${status}"`)
  }
}

export default prismaGoalStatusToGraphQL
