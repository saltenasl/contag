import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import updateConstituents from 'src/dal/item/goal/updateConstituents'
import listItems from 'src/dal/item/list'
import type { MutationResolvers, ObjectReference } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import prismaGoalItemToGraphQL from 'src/transformers/item/prismaGoalToGraphQL'
import type { Item, User } from 'src/types'
import validateItem from '../validators/item'

const validateConstituentsAdded = async ({
  item,
  constituents,
  currentUser,
  prisma,
}: {
  item: Item<'goal'>
  constituents: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (constituents.length === 0) {
    return []
  }

  const constituentIds = constituents.map(({ id }) => idFromGraphQLToPrisma(id))

  if (
    constituentIds.some((id) =>
      item.goal.constituents.some((constituent) => id === constituent.id)
    )
  ) {
    throw new GraphQLError('Constituent(s) already added')
  }

  const constituentsUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: constituentIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (constituentIds.length !== constituentsUserHasAccessTo.length) {
    throw new GraphQLError('Constituent(s) not found')
  }

  return constituentIds
}

const validateConstituentsRemoved = async ({
  item,
  constituents,
  currentUser,
  prisma,
}: {
  item: Item<'goal'>
  constituents: ObjectReference[]
  prisma: PrismaClient
  currentUser: User
}) => {
  if (constituents.length === 0) {
    return []
  }

  const constituentIds = constituents.map(({ id }) => idFromGraphQLToPrisma(id))

  if (
    !constituentIds.every((id) =>
      item.goal.constituents.some((constituent) => id === constituent.id)
    )
  ) {
    throw new GraphQLError('Constituent(s) not found')
  }

  const constituentsUserHasAccessTo = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: constituentIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  if (constituentIds.length !== constituentsUserHasAccessTo.length) {
    throw new GraphQLError('Constituent(s) not found')
  }

  return constituentIds
}

const updateGoalConstituents: Required<MutationResolvers>['updateGoalConstituents'] =
  async (_, args, context) => {
    const item = (await validateItem({
      id: args.itemId,
      currentUser: context.user,
      prisma: context.prisma,
      itemType: 'goal',
    })) as Item<'goal'> // validateItem checks that this is indeed a goal, however, i don't know how to type it so it returns a Item<'goal'> since there are other functions that pass itemType dynamically and it breaks them.

    const [constituentsAddedIds, constituentsRemovedIds] = await Promise.all([
      validateConstituentsAdded({
        item,
        constituents: args.constituentsAdded,
        currentUser: context.user,
        prisma: context.prisma,
      }),
      validateConstituentsRemoved({
        item,
        constituents: args.constituentsRemoved,
        currentUser: context.user,
        prisma: context.prisma,
      }),
    ])

    const goal = await updateConstituents({
      constituentsAddedIds,
      constituentsRemovedIds,
      item,
      prisma: context.prisma,
    })

    return prismaGoalItemToGraphQL(
      {
        ...item,
        goal,
      },
      { currentUser: context.user, hasQuestionParent: false }
    )
  }

export default updateGoalConstituents
