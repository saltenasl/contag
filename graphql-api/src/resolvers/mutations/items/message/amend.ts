import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import prismaMessageItemToGraphQL from 'src/transformers/item/prismaMessageToGraphQL'
import amendMessageItem from 'src/dal/item/message/amend'
import getParentItem from 'src/dal/item/getParent'
import validateAmendItem from '../validators/amend'
import validateAttachments from '../utils/validateAttachments'
import alterAuthorizationForUpdatedItemsAttachments from 'src/filesystem/alterAuthorizationForUpdatedItem'

const amendMessage: Required<MutationResolvers>['amendMessage'] = async (
  _,
  args,
  context
) => {
  const { item, addedSharedWithUsers, removedSharedWithUsers } =
    await validateAmendItem({
      prisma: context.prisma,
      id: args.input.id,
      currentUser: context.user,
      to: null,
      sharedWith: args.input.sharedWith,
      itemType: 'message',
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

  const updatedItem = await amendMessageItem({
    item: item,
    prisma: context.prisma,
    text: args.input.text,
    richText: args.input.richText,
    attachmentsAddedIds: attachmentsAdded.map(({ id }) => id),
    attachmentsRemovedIds: attachmentsRemoved.map(({ id }) => id),
    addedSharedWithUserIds: addedSharedWithUsers.map(({ id }) => id),
    removedSharedWithUserIds: removedSharedWithUsers.map(({ id }) => id),
  })

  if (!updatedItem.message) {
    // This should never be reached
    throw new GraphQLError('Amending message failed')
  }

  alterAuthorizationForUpdatedItemsAttachments({
    item: updatedItem,
    addedSharedWithUsers,
    removedSharedWithUsers,
    attachmentsAdded,
    attachmentsRemoved,
  })

  return prismaMessageItemToGraphQL(
    {
      ...updatedItem,
      message: updatedItem.message,
    },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default amendMessage
