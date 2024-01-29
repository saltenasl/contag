import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import amendInfoItem from 'src/dal/item/info/amend'
import prismaInfoItemToGraphQL from 'src/transformers/item/prismaInfoToGraphQL'
import getParentItem from 'src/dal/item/getParent'
import validateAmendItem from '../validators/amend'
import updateActionExpectationFulfilled from 'src/dal/item/actionExpectation/updateFulfilled'
import validateAttachments from '../utils/validateAttachments'
import alterAuthorizationForUpdatedItemsAttachments from 'src/filesystem/alterAuthorizationForUpdatedItem'

const amendInfo: Required<MutationResolvers>['amendInfo'] = async (
  _,
  args,
  context
) => {
  const {
    item,
    addedToUsers,
    removedToUsers,
    addedSharedWithUsers,
    removedSharedWithUsers,
  } = await validateAmendItem({
    prisma: context.prisma,
    id: args.input.id,
    currentUser: context.user,
    to: args.input.to,
    sharedWith: args.input.sharedWith,
    itemType: 'info',
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

  if (args.input.acknowledged === true && item.actionExpectation) {
    await updateActionExpectationFulfilled({
      fulfilled: true,
      prisma: context.prisma,
      item: { ...item, actionExpectation: item.actionExpectation },
    })
  }

  const updatedItem = await amendInfoItem({
    item,
    prisma: context.prisma,
    text: args.input.text,
    richText: args.input.richText,
    acknowledged: args.input.acknowledged,
    actionExpectation: args.input.actionExpectation,
    attachmentsAddedIds: attachmentsAdded.map(({ id }) => id),
    attachmentsRemovedIds: attachmentsRemoved.map(({ id }) => id),
    addedToUserIds: addedToUsers.map(({ id }) => id),
    removedToUserIds: removedToUsers.map(({ id }) => id),
    addedSharedWithUserIds: addedSharedWithUsers.map(({ id }) => id),
    removedSharedWithUserIds: removedSharedWithUsers.map(({ id }) => id),
  })

  if (!updatedItem.info) {
    // This should never be reached
    throw new GraphQLError('Amending info failed')
  }

  alterAuthorizationForUpdatedItemsAttachments({
    item,
    attachmentsAdded,
    attachmentsRemoved,
    addedSharedWithUsers,
    removedSharedWithUsers,
  })

  return prismaInfoItemToGraphQL(
    { ...updatedItem, info: updatedItem.info },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default amendInfo
