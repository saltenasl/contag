import type { MutationResolvers } from 'src/generated/graphql'
import { GraphQLError } from 'graphql'
import validateItemParent from '../utils/validateParent'
import getRecipientsUserIds from '../../../../dal/user/getRecipientsUserIds'
import createGoalItem from 'src/dal/item/goal/create'
import prismaGoalItemToGraphQL from 'src/transformers/item/prismaGoalToGraphQL'
import validateAttachments from '../utils/validateAttachments'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'

const createGoal: Required<MutationResolvers>['createGoal'] = async (
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

  const item = await createGoalItem({
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

  if (!item.goal) {
    // This is never reached - prisma insert would've failed and thrown
    throw new GraphQLError('Goal creation failed')
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

  return prismaGoalItemToGraphQL(
    { ...item, goal: item.goal },
    { hasQuestionParent: !!parent?.question, currentUser: context.user }
  )
}

export default createGoal
