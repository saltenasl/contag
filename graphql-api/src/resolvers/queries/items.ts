import { TypeName } from 'src/constants'
import type { ItemsFilters, QueryResolvers } from 'src/generated/graphql'
import type { User } from 'src/types'
import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/parseGraphQLId'
import listItems from 'src/dal/item/list'
import upsertItemsActivity from 'src/dal/feedActivity/upsert'
import getParentItem from 'src/dal/item/getParent'
import getUser from 'src/dal/user/get'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'

const validateParent = async ({
  prisma,
  parentId,
  currentUser,
}: {
  prisma: PrismaClient
  parentId: ItemsFilters['parentId']
  currentUser: User
}): Promise<{
  parent: { id: number; entity: string } | null
  isQueryingOwnItems: boolean
  hasQuestionParent: boolean
}> => {
  const parent = parentId ? idFromGraphQLToPrisma(parentId) : null

  if (parent === null) {
    return { parent: null, isQueryingOwnItems: false, hasQuestionParent: false }
  }

  if (!parent.entity) {
    throw new GraphQLError('Invalid parent')
  }

  if (
    parent?.entity &&
    ![TypeName.ITEM, TypeName.USER].includes(parent.entity as TypeName)
  ) {
    throw new GraphQLError(`Invalid parentId entity type "${parent.entity}"`)
  }

  if (parent.entity === TypeName.ITEM) {
    const parentItem = await getParentItem({
      prisma,
      currentUser,
      parentId: parent.id,
    })

    if (!parentItem) {
      throw new GraphQLError('Parent not found')
    }

    return {
      parent: { id: parent.id, entity: parent.entity },
      isQueryingOwnItems: false,
      hasQuestionParent:
        !!parentItem.questionId &&
        parentItem.sharedWith.some(({ user }) => user.id === currentUser.id),
    }
  }

  if (parent.id === currentUser.id) {
    return {
      parent: { id: parent.id, entity: parent.entity },
      isQueryingOwnItems: true,
      hasQuestionParent: false,
    }
  }

  const parentUser = await getUser({
    prisma,
    id: parent.id,
    currentUser,
  })

  if (!parentUser) {
    throw new GraphQLError('Parent not found')
  }

  return {
    parent: { id: parent.id, entity: parent.entity },
    isQueryingOwnItems: false,
    hasQuestionParent: false,
  }
}

const queryItems: Required<QueryResolvers>['items'] = async (
  _,
  args,
  context
) => {
  upsertItemsActivity({
    prisma: context.prisma,
    currentUserId: context.user.id,
    parent: args.filters.parentId,
  }).catch(console.error)

  const { prisma, user: currentUser } = context

  const { sort, filters } = args
  const { parentId, itemType } = filters

  const { parent, isQueryingOwnItems, hasQuestionParent } =
    await validateParent({
      prisma,
      parentId,
      currentUser,
    })

  const parentItemId =
    parent?.entity === TypeName.ITEM && parent.id ? parent.id : null

  const items = await listItems({
    prisma,
    currentUserId: currentUser.id,
    filterByUserId: parent?.entity === TypeName.USER ? parent.id : undefined,
    parentId: args.filters.search ? undefined : parentItemId,
    sort,
    isQueryingOwnItems,
    itemType,
    actionExpectation: filters.actionExpectation ?? null,
    search: args.filters.search,
  })

  return items
    .map((item) =>
      prismaItemToGraphQL(item, { hasQuestionParent, currentUser })
    )
    .filter(<T>(item: T | undefined): item is T => !!item)
}

export default queryItems
