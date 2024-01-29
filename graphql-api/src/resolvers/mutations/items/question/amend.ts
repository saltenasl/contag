import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import prismaQuestionItemToGraphQL from 'src/transformers/item/prismaQuestionToGraphQL'
import amendQuestionItem from 'src/dal/item/question/amend'
import validateAmendItem from '../validators/amend'
import getParentItem from 'src/dal/item/getParent'
import validateAttachments from '../utils/validateAttachments'
import alterAuthorizationForUpdatedItemsAttachments from 'src/filesystem/alterAuthorizationForUpdatedItem'

const amendQuestion: Required<MutationResolvers>['amendQuestion'] = async (
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
    itemType: 'question',
    to: args.input.to,
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

  const updatedItem = await amendQuestionItem({
    item,
    prisma: context.prisma,
    text: args.input.text,
    richText: args.input.richText,
    actionExpectation: args.input.actionExpectation,
    attachmentsAddedIds: attachmentsAdded.map(({ id }) => id),
    attachmentsRemovedIds: attachmentsRemoved.map(({ id }) => id),
    addedToUserIds: addedToUsers.map(({ id }) => id),
    addedSharedWithUserIds: addedSharedWithUsers.map(({ id }) => id),
    removedSharedWithUserIds: removedSharedWithUsers.map(({ id }) => id),
    removedToUserIds: removedToUsers.map(({ id }) => id),
  })

  if (!updatedItem.question) {
    // This should never be reached
    throw new GraphQLError('Amending question failed')
  }

  alterAuthorizationForUpdatedItemsAttachments({
    addedSharedWithUsers,
    removedSharedWithUsers,
    attachmentsAdded,
    attachmentsRemoved,
    item: updatedItem,
  })

  return prismaQuestionItemToGraphQL(
    {
      ...updatedItem,
      question: updatedItem.question,
    },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default amendQuestion
