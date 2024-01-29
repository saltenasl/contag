import { TaskStatus as PrismaTaskStatus } from '@prisma/client'
import { TaskStatus } from 'src/generated/graphql'

const prismaTaskStatusToGraphQL = (status: PrismaTaskStatus): TaskStatus => {
  switch (status) {
    case PrismaTaskStatus.TODO:
      return TaskStatus.Todo
    case PrismaTaskStatus.DONE:
      return TaskStatus.Done
    default:
      throw new Error(`Unknown Task Status "${status}"`)
  }
}

export default prismaTaskStatusToGraphQL
