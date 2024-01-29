import { GoalStatus as PrismaGoalStatus } from '@prisma/client'
import { GoalStatus } from 'src/generated/graphql'

const graphQLGoalStatusToPrisma = (status: GoalStatus): PrismaGoalStatus => {
  switch (status) {
    case GoalStatus.Todo:
      return PrismaGoalStatus.TODO
    case GoalStatus.Done:
      return PrismaGoalStatus.DONE
    default:
      throw new Error(`Unknown Goal Status "${status}"`)
  }
}

export default graphQLGoalStatusToPrisma
