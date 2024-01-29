import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { GraphQLError } from 'graphql'
import updateItemIsBlockedByDalMethod from 'src/dal/item/updateItemIsBlockedBy'
import listItems from 'src/dal/item/list'
import type { MutationResolvers, ObjectReference } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { GenericItem, User } from 'src/types'
import validateItem from './validators/item'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'

const validateItemsAddedNotFormingLoops = async ({
  prisma,
  item,
  blockedByAddedIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  blockedByAddedIds: number[]
}) => {
  const result = await prisma.$queryRaw<{ path: number[] }[]>`
    WITH RECURSIVE loops AS (
      SELECT id, ARRAY[id] AS path
      FROM "Item"
      WHERE id IN (${Prisma.join(blockedByAddedIds)})
      UNION ALL
      SELECT i.id, path || i.id
      FROM "Item" i
      JOIN "_item-blocks-is-blocked-by" b ON i.id = b."A"
      JOIN loops l ON b."B" = l.id
      WHERE NOT i.id = ANY(path)
    )
    SELECT DISTINCT path
    FROM loops
    WHERE path[array_upper(path, 1)] = ${item.id};
  `

  if (result.length > 0) {
    throw new GraphQLError('Item cannot be blocked by itself')
  }
}

const validateBlockedByAdded = async ({
  item,
  blockedBy,
  currentUser,
  prisma,
}: {
  item: GenericItem
  blockedBy: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (blockedBy.length === 0) {
    return []
  }

  const blockedByAddedIds = blockedBy.map(({ id }) => idFromGraphQLToPrisma(id))

  if (
    blockedByAddedIds.some((id) =>
      item.isBlockedBy.some((itemBlocked) => id === itemBlocked.id)
    )
  ) {
    throw new GraphQLError('Item(s) blocked by already added')
  }

  const blockedByItemsUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: blockedByAddedIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (blockedByAddedIds.length !== blockedByItemsUserHasAccessTo.length) {
    throw new GraphQLError('Item(s) blocked by not found')
  }

  await validateItemsAddedNotFormingLoops({
    item,
    prisma,
    blockedByAddedIds,
  })

  return blockedByAddedIds
}

const validateBlockedByRemoved = async ({
  item,
  blockedBy,
  currentUser,
  prisma,
}: {
  item: GenericItem
  blockedBy: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (blockedBy.length === 0) {
    return []
  }

  const blockedByRemovedIds = blockedBy.map(({ id }) =>
    idFromGraphQLToPrisma(id)
  )

  if (
    !blockedByRemovedIds.every((id) =>
      item.isBlockedBy.some((itemBlocked) => id === itemBlocked.id)
    )
  ) {
    throw new GraphQLError('Item(s) blocked by not found')
  }

  const blockedByUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: blockedByRemovedIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (blockedByRemovedIds.length !== blockedByUserHasAccessTo.length) {
    throw new GraphQLError('Item(s) blocked by not found')
  }

  return blockedByRemovedIds
}

const updateItemIsBlockedBy: Required<MutationResolvers>['updateItemIsBlockedBy'] =
  async (_, args, context) => {
    const item = await validateItem({
      id: args.itemId,
      currentUser: context.user,
      prisma: context.prisma,
    })

    const [blockedByAddedIds, blockedByRemovedIds] = await Promise.all([
      validateBlockedByAdded({
        item,
        blockedBy: args.blockedByAdded,
        currentUser: context.user,
        prisma: context.prisma,
      }),
      validateBlockedByRemoved({
        item,
        blockedBy: args.blockedByRemoved,
        currentUser: context.user,
        prisma: context.prisma,
      }),
    ])

    const updatedItem = await updateItemIsBlockedByDalMethod({
      blockedByAddedIds,
      blockedByRemovedIds,
      item,
      prisma: context.prisma,
    })

    return prismaItemToGraphQL(updatedItem, {
      currentUser: context.user,
      hasQuestionParent: false,
    })
  }

export default updateItemIsBlockedBy
