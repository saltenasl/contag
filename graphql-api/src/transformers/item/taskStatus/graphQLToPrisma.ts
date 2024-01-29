import { TaskStatus as PrismaTaskStatus } from '@prisma/client'
import { TaskStatus } from 'src/generated/graphql'

const graphQLTaskStatusToPrisma = (status: TaskStatus): PrismaTaskStatus => {
  switch (status) {
    case TaskStatus.Todo:
      return PrismaTaskStatus.TODO
    case TaskStatus.Done:
      return PrismaTaskStatus.DONE
    default:
      throw new Error(`Unknown Task Status "${status}"`)
  }
}

export default graphQLTaskStatusToPrisma
