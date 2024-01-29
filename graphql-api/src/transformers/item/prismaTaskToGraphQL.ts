import { TypeName } from 'src/constants'
import type { Task } from 'src/generated/graphql'
import type { Item, User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import fileFromPrismaToGraphQL from '../file/prismaToGraphQL'
import idFromPrismaToGraphQL from '../id/prismaToGraphQL'
import prismaTaskStatusToGraphQL from './taskStatus/prismaToGraphQL'
import prismaActionExpectationToGraphQL from './shared/prismaActionExpectationToGraphQL'
import prismaSummaryToGraphQL from './shared/prismaSummaryToGraphQL'

type GraphQLTask = Required<
  Omit<Task, 'childCount' | 'goals' | 'blocks' | 'blockedBy'>
> // child count, goals, blocks, and blockedBy are retrieved through a separate resolver

const prismaTaskItemToGraphQL = (
  item: Item<'task'>,
  {
    hasQuestionParent = false,
    currentUser,
  }: { hasQuestionParent: boolean; currentUser: User }
): GraphQLTask => {
  const transformedTask = transformEntityFromPrismaToGraphQL(
    item.task,
    TypeName.TASK
  )

  return {
    __typename: TypeName.TASK,
    id: idFromPrismaToGraphQL(item.id, TypeName.ITEM),
    parentId: item.parentId
      ? idFromPrismaToGraphQL(item.parentId, TypeName.ITEM)
      : null,
    author: transformEntityFromPrismaToGraphQL(item.author, TypeName.USER),
    text: transformedTask.description,
    richText: transformedTask.richText,
    to:
      item.addressedTo.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    sharedWith:
      item.sharedWith.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    createdAt: item.createdAt,
    status: prismaTaskStatusToGraphQL(transformedTask.status),
    updatedAt: item.task.updatedAt,
    isAcceptedAnswer: hasQuestionParent ? !!item.answerFor : null,
    actionExpectation: prismaActionExpectationToGraphQL({
      item,
      currentUser,
    }),
    summary: prismaSummaryToGraphQL(item),
    attachments: item.attachments.map(fileFromPrismaToGraphQL),
  }
}

export default prismaTaskItemToGraphQL
