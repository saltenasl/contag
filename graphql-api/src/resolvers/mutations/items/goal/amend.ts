import type { MutationResolvers } from 'src/generated/graphql'
import { GoalStatus } from 'src/generated/graphql'
import graphQLGoalStatusToPrisma from 'src/transformers/item/goalStatus/graphQLToPrisma'
import { GraphQLError } from 'graphql'
import amendGoalItem from 'src/dal/item/goal/amend'
import prismaGoalItemToGraphQL from 'src/transformers/item/prismaGoalToGraphQL'
import getParentItem from 'src/dal/item/getParent'
import validateAmendItem from '../validators/amend'
import updateActionExpectationFulfilled from 'src/dal/item/actionExpectation/updateFulfilled'
import validateAttachments from '../utils/validateAttachments'
import alterAuthorizationForUpdatedItemsAttachments from 'src/filesystem/alterAuthorizationForUpdatedItem'

const amendGoal: Required<MutationResolvers>['amendGoal'] = async (
  _,
  args,
  context
) => {
  const {
    item,
    addedToUsers,
    addedSharedWithUsers,
    removedSharedWithUsers,
    removedToUsers,
  } = await validateAmendItem({
    prisma: context.prisma,
    id: args.input.id,
    currentUser: context.user,
    to: args.input.to,
    itemType: 'goal',
    sharedWith: args.input.sharedWith,
  })

  const parent = item.parentId
    ? await getParentItem({
        currentUser: context.user,
        prisma: context.prisma,
        parentId: item.parentId,
      })
    : null

  const { attachmentsAdded, attachmentsRemoved } = await validateAttachments({
    attachments: args.input.attachments,
    prisma: context.prisma,
    currentUser: context.user,
    currentAttachments: item.attachments,
  })

  if (args.input.goalStatus && item.actionExpectation) {
    await updateActionExpectationFulfilled({
      fulfilled: args.input.goalStatus === GoalStatus.Done,
      prisma: context.prisma,
      item: { ...item, actionExpectation: item.actionExpectation },
    })
  }

  const updatedItem = await amendGoalItem({
    item,
    prisma: context.prisma,
    text: args.input.text,
    richText: args.input.richText,
    goalStatus: args.input.goalStatus
      ? graphQLGoalStatusToPrisma(args.input.goalStatus)
      : undefined,
    actionExpectation: args.input.actionExpectation,
    attachmentsAddedIds: attachmentsAdded.map(({ id }) => id),
    attachmentsRemovedIds: attachmentsRemoved.map(({ id }) => id),
    addedToUserIds: addedToUsers.map(({ id }) => id),
    addedSharedWithUserIds: addedSharedWithUsers.map(({ id }) => id),
    removedSharedWithUserIds: removedSharedWithUsers.map(({ id }) => id),
    removedToUserIds: removedToUsers.map(({ id }) => id),
  })

  if (!updatedItem.goal) {
    // This should never be reached
    throw new GraphQLError('Amending goal failed')
  }

  alterAuthorizationForUpdatedItemsAttachments({
    item: updatedItem,
    addedSharedWithUsers,
    removedSharedWithUsers,
    attachmentsAdded,
    attachmentsRemoved,
  })

  return prismaGoalItemToGraphQL(
    { ...updatedItem, goal: updatedItem.goal },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default amendGoal
