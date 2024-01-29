import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import validateItemParent from '../utils/validateParent'
import getRecipientsUserIds from '../../../../dal/user/getRecipientsUserIds'
import createQuestionItem from 'src/dal/item/question/create'
import prismaQuestionItemToGraphQL from 'src/transformers/item/prismaQuestionToGraphQL'
import validateAttachments from '../utils/validateAttachments'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'

const createQuestion: Required<MutationResolvers>['createQuestion'] = async (
  _,
  args,
  context
) => {
  if (!args.input.shareWith && !args.input.parentId && !args.input.to) {
    throw new GraphQLError(
      'Must provide one of "parentId", "shareWith" or "to"'
    )
  }

  const { parent } = await validateItemParent({
    currentUser: context.user,
    parentId: args.input.parentId,
    prisma: context.prisma,
  })

  const { addressedToUserIds, shareWithUserIds } = await getRecipientsUserIds({
    parent,
    shareWith: args.input.shareWith,
    addressedTo: args.input.to,
    prisma: context.prisma,
    currentUser: context.user,
  })

  const { attachmentsAdded } = await validateAttachments({
    attachments: args.input.attachments,
    currentUser: context.user,
    prisma: context.prisma,
  })

  const item = await createQuestionItem({
    prisma: context.prisma,
    currentUserId: context.user.id,
    text: args.input.text,
    richText: args.input.richText,
    parentId: parent ? parent.id : null,
    addressedToUserIds,
    shareWithUserIds,
    actionExpectation: args.input.actionExpectation,
    attachmentIds: attachmentsAdded.map(({ id }) => id),
  })

  if (!item.question) {
    // This is never reached - prisma insert would've failed and thrown
    throw new GraphQLError('Question creation failed')
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

  return prismaQuestionItemToGraphQL(
    { ...item, question: item.question },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default createQuestion
