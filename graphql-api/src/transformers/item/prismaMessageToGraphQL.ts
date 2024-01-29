import { TypeName } from 'src/constants'
import type { Message } from 'src/generated/graphql'
import type { Item, User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import fileFromPrismaToGraphQL from '../file/prismaToGraphQL'
import idFromPrismaToGraphQL from '../id/prismaToGraphQL'
import prismaSummaryToGraphQL from './shared/prismaSummaryToGraphQL'

type GraphQLMessage = Required<
  Omit<Message, 'childCount' | 'goals' | 'blocks' | 'blockedBy'>
> // child count, goals, blocks, and blockedBy are retrieved through a separate resolver

const prismaMessageItemToGraphQL = (
  item: Item<'message'>,
  {
    hasQuestionParent = false,
  }: { hasQuestionParent: boolean; currentUser: User }
): GraphQLMessage => {
  const transformedMessage = transformEntityFromPrismaToGraphQL(
    item.message,
    TypeName.MESSAGE
  )

  return {
    __typename: TypeName.MESSAGE,
    id: idFromPrismaToGraphQL(item.id, TypeName.ITEM),
    parentId: item.parentId
      ? idFromPrismaToGraphQL(item.parentId, TypeName.ITEM)
      : null,
    author: transformEntityFromPrismaToGraphQL(item.author, TypeName.USER),
    text: transformedMessage.text,
    richText: transformedMessage.richText,
    to:
      item.addressedTo.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    sharedWith:
      item.sharedWith.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    createdAt: item.createdAt,
    updatedAt: item.message.updatedAt,
    isAcceptedAnswer: hasQuestionParent ? !!item.answerFor : null,
    summary: prismaSummaryToGraphQL(item),
    attachments: item.attachments.map(fileFromPrismaToGraphQL),
  }
}

export default prismaMessageItemToGraphQL
