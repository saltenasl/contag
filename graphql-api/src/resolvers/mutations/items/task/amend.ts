import type { MutationResolvers } from 'src/generated/graphql'
import { TaskStatus } from 'src/generated/graphql'
import graphQLTaskStatusToPrisma from 'src/transformers/item/taskStatus/graphQLToPrisma'
import { GraphQLError } from 'graphql'
import amendTaskItem from 'src/dal/item/task/amend'
import prismaTaskItemToGraphQL from 'src/transformers/item/prismaTaskToGraphQL'
import getParentItem from 'src/dal/item/getParent'
import validateAmendItem from '../validators/amend'
import updateActionExpectationFulfilled from 'src/dal/item/actionExpectation/updateFulfilled'
import validateAttachments from '../utils/validateAttachments'
import alterAuthorizationForUpdatedItemsAttachments from 'src/filesystem/alterAuthorizationForUpdatedItem'

const amendTask: Required<MutationResolvers>['amendTask'] = async (
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
    itemType: 'task',
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

  if (args.input.status && item.actionExpectation) {
    await updateActionExpectationFulfilled({
      fulfilled: args.input.status === TaskStatus.Done,
      prisma: context.prisma,
      item: { ...item, actionExpectation: item.actionExpectation },
    })
  }

  const updatedItem = await amendTaskItem({
    item,
    prisma: context.prisma,
    text: args.input.text,
    richText: args.input.richText,
    status: args.input.status
      ? graphQLTaskStatusToPrisma(args.input.status)
      : undefined,
    actionExpectation: args.input.actionExpectation,
    attachmentsAddedIds: attachmentsAdded.map(({ id }) => id),
    attachmentsRemovedIds: attachmentsRemoved.map(({ id }) => id),
    addedToUserIds: addedToUsers.map(({ id }) => id),
    addedSharedWithUserIds: addedSharedWithUsers.map(({ id }) => id),
    removedSharedWithUserIds: removedSharedWithUsers.map(({ id }) => id),
    removedToUserIds: removedToUsers.map(({ id }) => id),
  })

  if (!updatedItem.task) {
    // This should never be reached
    throw new GraphQLError('Amending task failed')
  }

  alterAuthorizationForUpdatedItemsAttachments({
    item: updatedItem,
    addedSharedWithUsers,
    removedSharedWithUsers,
    attachmentsAdded,
    attachmentsRemoved,
  })

  return prismaTaskItemToGraphQL(
    { ...updatedItem, task: updatedItem.task },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default amendTask
