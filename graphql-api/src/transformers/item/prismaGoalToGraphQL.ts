import { TypeName } from 'src/constants'
import type { Goal } from 'src/generated/graphql'
import type { Item, User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import fileFromPrismaToGraphQL from '../file/prismaToGraphQL'
import idFromPrismaToGraphQL from '../id/prismaToGraphQL'
import prismaGoalStatusToGraphQL from './goalStatus/prismaToGraphQL'
import prismaActionExpectationToGraphQL from './shared/prismaActionExpectationToGraphQL'
import prismaSummaryToGraphQL from './shared/prismaSummaryToGraphQL'

type GraphQLGoal = Required<
  Omit<Goal, 'childCount' | 'constituents' | 'goals' | 'blocks' | 'blockedBy'>
> // child count, constituents, goals, blocks, and blockedBy are retrieved through a separate resolver

const prismaGoalItemToGraphQL = (
  item: Item<'goal'>,
  {
    hasQuestionParent = false,
    currentUser,
  }: { hasQuestionParent: boolean; currentUser: User }
): GraphQLGoal => {
  const transformedGoal = transformEntityFromPrismaToGraphQL(
    item.goal,
    TypeName.GOAL
  )

  return {
    __typename: TypeName.GOAL,
    id: idFromPrismaToGraphQL(item.id, TypeName.ITEM),
    parentId: item.parentId
      ? idFromPrismaToGraphQL(item.parentId, TypeName.ITEM)
      : null,
    author: transformEntityFromPrismaToGraphQL(item.author, TypeName.USER),
    text: transformedGoal.title,
    richText: transformedGoal.richText,
    to:
      item.addressedTo.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    sharedWith:
      item.sharedWith.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    createdAt: item.createdAt,
    goalStatus: prismaGoalStatusToGraphQL(transformedGoal.status),
    updatedAt: item.goal.updatedAt,
    isAcceptedAnswer: hasQuestionParent ? !!item.answerFor : null,
    actionExpectation: prismaActionExpectationToGraphQL({
      item,
      currentUser,
    }),
    summary: prismaSummaryToGraphQL(item),
    attachments: item.attachments.map(fileFromPrismaToGraphQL),
  }
}

export default prismaGoalItemToGraphQL
