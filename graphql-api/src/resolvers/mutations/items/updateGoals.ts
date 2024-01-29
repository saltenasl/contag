import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import updateGoals from 'src/dal/item/updateGoals'
import listItems from 'src/dal/item/list'
import type { MutationResolvers, ObjectReference } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { GenericItem, User } from 'src/types'
import validateItem from './validators/item'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'

const validateGoalsAdded = async ({
  item,
  goals,
  currentUser,
  prisma,
}: {
  item: GenericItem
  goals: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (goals.length === 0) {
    return []
  }

  const goalItemIds = goals.map(({ id }) => idFromGraphQLToPrisma(id))

  if (
    goalItemIds.some((id) => item.goals.some((goal) => id === goal.item?.id))
  ) {
    throw new GraphQLError('Goal(s) already added')
  }

  const goalsUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: goalItemIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (goalItemIds.length !== goalsUserHasAccessTo.length) {
    throw new GraphQLError('Goal(s) not found')
  }

  if (goalsUserHasAccessTo.some(({ goal }) => goal === null)) {
    throw new GraphQLError('Non goal item(s) passed in goalsAdded')
  }

  return goalsUserHasAccessTo.map(({ goal }) => goal?.id as number) // if goal was null - the above condition would throw an error
}

const validateGoalsRemoved = async ({
  item,
  goals,
  currentUser,
  prisma,
}: {
  item: GenericItem
  goals: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (goals.length === 0) {
    return []
  }

  const goalItemIds = goals.map(({ id }) => idFromGraphQLToPrisma(id))

  if (
    !goalItemIds.every((id) => item.goals.some((goal) => id === goal.item?.id))
  ) {
    throw new GraphQLError('Goal(s) not found')
  }

  const goalsUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: goalItemIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (goalItemIds.length !== goalsUserHasAccessTo.length) {
    throw new GraphQLError('Goal(s) not found')
  }

  if (goalsUserHasAccessTo.some(({ goal }) => goal === null)) {
    throw new GraphQLError('Non goal item(s) passed in goalsRemoved')
  }

  return goalsUserHasAccessTo.map(({ goal }) => goal?.id as number) // if goal was null - the above condition would throw an error
}

const updateItemGoals: Required<MutationResolvers>['updateItemGoals'] = async (
  _,
  args,
  context
) => {
  const item = await validateItem({
    id: args.itemId,
    currentUser: context.user,
    prisma: context.prisma,
  })

  const [goalsAddedIds, goalsRemovedIds] = await Promise.all([
    validateGoalsAdded({
      item,
      goals: args.goalsAdded,
      currentUser: context.user,
      prisma: context.prisma,
    }),
    validateGoalsRemoved({
      item,
      goals: args.goalsRemoved,
      currentUser: context.user,
      prisma: context.prisma,
    }),
  ])

  const updatedItem = await updateGoals({
    goalsAddedIds,
    goalsRemovedIds,
    item,
    prisma: context.prisma,
  })

  return prismaItemToGraphQL(updatedItem, {
    currentUser: context.user,
    hasQuestionParent: false,
  })
}

export default updateItemGoals
