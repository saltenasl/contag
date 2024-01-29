import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { GraphQLError } from 'graphql'
import updateItemsBlockedDalMethod from 'src/dal/item/updateItemsBlocked'
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
  itemsBlockedAddedIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  itemsBlockedAddedIds: number[]
}) => {
  const result = await prisma.$queryRaw<{ path: number[] }[]>`
    WITH RECURSIVE loops AS (
      SELECT id, ARRAY[id] AS path
      FROM "Item"
      WHERE id IN (${Prisma.join(itemsBlockedAddedIds)})
      UNION ALL
      SELECT i.id, path || i.id
      FROM "Item" i
      JOIN "_item-blocks-is-blocked-by" b ON i.id = b."B"
      JOIN loops l ON b."A" = l.id
      WHERE NOT i.id = ANY(path)
    )
    SELECT DISTINCT path
    FROM loops
    WHERE path[array_upper(path, 1)] = ${item.id};
  `

  if (result.length > 0) {
    throw new GraphQLError('Item cannot block itself')
  }
}

const validateItemsBlockedAdded = async ({
  item,
  itemsBlocked,
  currentUser,
  prisma,
}: {
  item: GenericItem
  itemsBlocked: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (itemsBlocked.length === 0) {
    return []
  }

  const itemsBlockedAddedIds = itemsBlocked.map(({ id }) =>
    idFromGraphQLToPrisma(id)
  )

  if (
    itemsBlockedAddedIds.some((id) =>
      item.blocks.some((itemBlocked) => id === itemBlocked.id)
    )
  ) {
    throw new GraphQLError('Item(s) blocked already added')
  }

  const itemsBlockedUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: itemsBlockedAddedIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (itemsBlockedAddedIds.length !== itemsBlockedUserHasAccessTo.length) {
    throw new GraphQLError('Item(s) blocked not found')
  }

  await validateItemsAddedNotFormingLoops({
    item,
    prisma,
    itemsBlockedAddedIds,
  })

  return itemsBlockedAddedIds
}

const validateItemsBlockedRemoved = async ({
  item,
  itemsBlocked,
  currentUser,
  prisma,
}: {
  item: GenericItem
  itemsBlocked: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (itemsBlocked.length === 0) {
    return []
  }

  const itemsBlockedRemovedIds = itemsBlocked.map(({ id }) =>
    idFromGraphQLToPrisma(id)
  )

  if (
    !itemsBlockedRemovedIds.every((id) =>
      item.blocks.some((itemBlocked) => id === itemBlocked.id)
    )
  ) {
    throw new GraphQLError('Item(s) blocked not found')
  }

  const itemsBlockedUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: itemsBlockedRemovedIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (itemsBlockedRemovedIds.length !== itemsBlockedUserHasAccessTo.length) {
    throw new GraphQLError('Item(s) blocked not found')
  }

  return itemsBlockedRemovedIds
}

const updateItemsBlocked: Required<MutationResolvers>['updateItemsBlocked'] =
  async (_, args, context) => {
    const item = await validateItem({
      id: args.itemId,
      currentUser: context.user,
      prisma: context.prisma,
    })

    const [itemsBlockedAddedIds, itemsBlockedRemovedIds] = await Promise.all([
      validateItemsBlockedAdded({
        item,
        itemsBlocked: args.itemsBlockedAdded,
        currentUser: context.user,
        prisma: context.prisma,
      }),
      validateItemsBlockedRemoved({
        item,
        itemsBlocked: args.itemsBlockedRemoved,
        currentUser: context.user,
        prisma: context.prisma,
      }),
    ])

    const updatedItem = await updateItemsBlockedDalMethod({
      itemsBlockedAddedIds,
      itemsBlockedRemovedIds,
      item,
      prisma: context.prisma,
    })

    return prismaItemToGraphQL(updatedItem, {
      currentUser: context.user,
      hasQuestionParent: false,
    })
  }

export default updateItemsBlocked
