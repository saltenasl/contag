import type { MutationResolvers, NestItemInput } from 'src/generated/graphql'
import nestItemDalMethod from 'src/dal/item/nest'
import getItem from 'src/dal/item/get'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import { GraphQLError } from 'graphql'
import parseGraphQLId from 'src/transformers/id/parseGraphQLId'
import { TypeName } from 'src/constants'
import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'

const validate = async ({
  prisma,
  input,
  currentUser,
}: {
  prisma: PrismaClient
  input: NestItemInput
  currentUser: User
}) => {
  const { id: newParentId, entity: newParentEntity } = parseGraphQLId(
    input.newParentId
  )

  if (
    !newParentEntity ||
    ![TypeName.USER, TypeName.ITEM].includes(newParentEntity as TypeName)
  ) {
    throw new GraphQLError('Invalid parent id')
  }

  const parentIsUser = newParentEntity === TypeName.USER

  const [item, newParentItem] = await Promise.all([
    getItem({
      prisma,
      id: idFromGraphQLToPrisma(input.itemId),
    }),
    parentIsUser
      ? null
      : getItem({
          prisma,
          id: newParentId,
        }),
  ])

  if (
    !item ||
    !isUserInItemsAudience(item, currentUser.id) ||
    (!parentIsUser && // don't check newParentItem if parent is user
      (!newParentItem || !isUserInItemsAudience(newParentItem, currentUser.id)))
  ) {
    throw new GraphQLError('Item or new parent not found')
  }

  if (item.id === newParentItem?.id) {
    throw new GraphQLError('Cannot nest item under itself')
  }

  return { item, parentIsUser, newParentId }
}

const isUserInItemsAudience = (
  item: Awaited<ReturnType<typeof getItem>>,
  userId: number
): boolean =>
  !!item?.sharedWith.some((recipient) => userId === recipient.userId)

const nestItem: Required<MutationResolvers>['nestItem'] = async (
  _,
  args,
  context
) => {
  const { prisma } = context

  const { item, parentIsUser, newParentId } = await validate({
    prisma,
    input: args.input,
    currentUser: context.user,
  })

  await nestItemDalMethod({
    prisma,
    itemId: item.id,
    newParentId: parentIsUser ? null : newParentId,
    removeAnswerForQuestion:
      (item.parentId !== newParentId && item.answerFor?.id) || null,
  })

  return { success: true }
}

export default nestItem
