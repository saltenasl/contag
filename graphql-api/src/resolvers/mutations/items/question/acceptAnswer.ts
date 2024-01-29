import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import updateActionExpectationFulfilled from 'src/dal/item/actionExpectation/updateFulfilled'
import getItem from 'src/dal/item/get'
import acceptAnswerForQuestion from 'src/dal/item/question/acceptAnswer'
import type { MutationResolvers } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'
import type { GenericItem, Item, User } from 'src/types'

const validate = async ({
  prisma,
  itemId,
  currentUser,
}: {
  prisma: PrismaClient
  itemId: string
  currentUser: User
}): Promise<{ item: GenericItem; parent: Item<'question'> }> => {
  const item = await getItem({
    id: idFromGraphQLToPrisma(itemId),
    prisma: prisma,
  })

  if (
    !item ||
    !item.sharedWith.some(({ user }) => user.id === currentUser.id)
  ) {
    throw new GraphQLError('Item not found')
  }

  if (!item.parentId) {
    throw new GraphQLError('Conflict')
  }

  const parent = await getItem({
    id: item.parentId,
    prisma: prisma,
  })

  if (
    !parent ||
    !parent.sharedWith.some(({ user }) => user.id === currentUser.id) ||
    !parent.question
  ) {
    throw new GraphQLError('Conflict')
  }

  return { item, parent: { ...parent, question: parent.question } }
}

const acceptAnswer: Required<MutationResolvers>['acceptAnswer'] = async (
  _,
  args,
  context
) => {
  const { item, parent } = await validate({
    prisma: context.prisma,
    currentUser: context.user,
    itemId: args.itemId,
  })

  const updatedItem = await acceptAnswerForQuestion({
    answerItem: item,
    prisma: context.prisma,
    questionItem: parent,
  })

  if (parent && parent.actionExpectation) {
    await updateActionExpectationFulfilled({
      fulfilled: true,
      prisma: context.prisma,
      item: { ...parent, actionExpectation: parent.actionExpectation },
    })
  }

  return prismaItemToGraphQL(updatedItem, {
    hasQuestionParent: true,
    currentUser: context.user,
  })
}

export default acceptAnswer
