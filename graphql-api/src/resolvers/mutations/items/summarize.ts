import type { MutationResolvers } from 'src/generated/graphql'
import summarizeItemDalMethod from 'src/dal/item/summary/upsert'
import getItem from 'src/dal/item/get'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import { GraphQLError } from 'graphql'
import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'
import getParentItem from 'src/dal/item/getParent'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'

const validate = async ({
  prisma,
  itemId,
  currentUser,
}: {
  prisma: PrismaClient
  itemId: number
  currentUser: User
}) => {
  const item = await getItem({ prisma, id: itemId })

  if (
    !item ||
    !item.sharedWith.some((recipient) => recipient.userId === currentUser.id)
  ) {
    throw new GraphQLError('Item not found')
  }

  return { item }
}

const summarizeItem: Required<MutationResolvers>['summarizeItem'] = async (
  _,
  args,
  context
) => {
  const { prisma } = context

  const { item } = await validate({
    prisma,
    itemId: idFromGraphQLToPrisma(args.itemId),
    currentUser: context.user,
  })

  const updatedItem = await summarizeItemDalMethod({
    prisma: context.prisma,
    itemId: item.id,
    text: args.text,
    richText: args.richText,
    shouldReplaceOriginalItem: args.shouldReplaceOriginalItem,
    currentUser: context.user,
  })

  const parent = item.parentId
    ? await getParentItem({
        currentUser: context.user,
        prisma: context.prisma,
        parentId: item.parentId,
      })
    : null

  return prismaItemToGraphQL(updatedItem, {
    currentUser: context.user,
    hasQuestionParent: !!parent?.question,
  })
}

export default summarizeItem
