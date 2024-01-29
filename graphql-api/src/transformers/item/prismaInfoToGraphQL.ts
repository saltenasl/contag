import { TypeName } from 'src/constants'
import type { Info } from 'src/generated/graphql'
import type { Item, User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import fileFromPrismaToGraphQL from '../file/prismaToGraphQL'
import idFromPrismaToGraphQL from '../id/prismaToGraphQL'
import prismaActionExpectationToGraphQL from './shared/prismaActionExpectationToGraphQL'
import prismaSummaryToGraphQL from './shared/prismaSummaryToGraphQL'

type GraphQLInfo = Required<
  Omit<Info, 'childCount' | 'goals' | 'blocks' | 'blockedBy'>
> // child count, goals, blocks, and blockedBy are retrieved through a separate resolver

const prismaInfoItemToGraphQL = (
  item: Item<'info'>,
  {
    hasQuestionParent = false,
    currentUser,
  }: { hasQuestionParent: boolean; currentUser: User }
): GraphQLInfo => {
  const transformedInfo = transformEntityFromPrismaToGraphQL(
    item.info,
    TypeName.INFO
  )

  return {
    __typename: TypeName.INFO,
    id: idFromPrismaToGraphQL(item.id, TypeName.ITEM),
    parentId: item.parentId
      ? idFromPrismaToGraphQL(item.parentId, TypeName.ITEM)
      : null,
    author: transformEntityFromPrismaToGraphQL(item.author, TypeName.USER),
    text: transformedInfo.text,
    richText: transformedInfo.richText,
    acknowledged: transformedInfo.acknowledged,
    to:
      item.addressedTo.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    sharedWith:
      item.sharedWith.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    createdAt: item.createdAt,
    updatedAt: item.info.updatedAt,
    isAcceptedAnswer: hasQuestionParent ? !!item.answerFor : null,
    actionExpectation: prismaActionExpectationToGraphQL({
      item,
      currentUser,
    }),
    summary: prismaSummaryToGraphQL(item),
    attachments: item.attachments.map(fileFromPrismaToGraphQL),
  }
}

export default prismaInfoItemToGraphQL
