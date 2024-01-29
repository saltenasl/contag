import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import getRecipientsUserIds from '../../../../dal/user/getRecipientsUserIds'
import validateItemParent from '../utils/validateParent'
import createMessageItem from 'src/dal/item/message/create'
import prismaMessageItemToGraphQL from 'src/transformers/item/prismaMessageToGraphQL'
import validateAttachments from '../utils/validateAttachments'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'

const sendMessage: Required<MutationResolvers>['sendMessage'] = async (
  _,
  args,
  context
) => {
  if (!args.input.shareWith && !args.input.parentId) {
    throw new GraphQLError('Must provide one of "parentId" or "shareWith"')
  }

  const { parent } = await validateItemParent({
    currentUser: context.user,
    parentId: args.input.parentId,
    prisma: context.prisma,
  })

  const { shareWithUserIds, addressedToUserIds } = await getRecipientsUserIds({
    parent,
    shareWith: args.input.shareWith,
    addressedTo: null,
    prisma: context.prisma,
    currentUser: context.user,
  })

  const { attachmentsAdded } = await validateAttachments({
    attachments: args.input.attachments,
    currentUser: context.user,
    prisma: context.prisma,
  })

  const item = await createMessageItem({
    prisma: context.prisma,
    currentUserId: context.user.id,
    addressedToUserIds,
    shareWithUserIds,
    parentId: parent ? parent.id : null,
    text: args.input.text,
    richText: args.input.richText,
    attachmentIds: attachmentsAdded.map(({ id }) => id),
  })

  if (!item.message) {
    // This is never reached - prisma insert would've failed and thrown
    throw new GraphQLError('Message creation failed')
  }

  item.attachments.forEach(({ filename }) => {
    item.sharedWith.forEach(({ user: { email } }) => {
      allowUserAccessToFile({
        operations: ['read'],
        userEmail: email,
        filename,
      })
    })
  })

  return prismaMessageItemToGraphQL(
    { ...item, message: item.message },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default sendMessage
