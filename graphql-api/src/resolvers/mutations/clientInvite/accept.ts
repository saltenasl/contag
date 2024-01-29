import { GraphQLError } from 'graphql'
import type { MutationResolvers } from 'src/generated/graphql'
import userClientFromPrismaToGraphQL from 'src/transformers/userClient/prismaToGraphQL'
import acceptClientInviteDalMethod from 'src/dal/clientInvite/accept'
import getClientInvite from 'src/dal/clientInvite/get'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'

const validate = async ({
  prisma,
  inviteId,
  currentUser,
}: {
  prisma: PrismaClient
  inviteId: string
  currentUser: User
}) => {
  const invite = await getClientInvite({
    prisma,
    id: idFromGraphQLToPrisma(inviteId),
  })

  if (!invite || invite.email !== currentUser.email) {
    throw new GraphQLError('Invite not found')
  }

  return { invite }
}

const acceptClientInvite: Required<MutationResolvers>['acceptClientInvite'] =
  async (_, args, context) => {
    const { invite } = await validate({
      prisma: context.prisma,
      inviteId: args.inviteId,
      currentUser: context.user,
    })

    const userClient = await acceptClientInviteDalMethod({
      prisma: context.prisma,
      currentUserId: context.user.id,
      invite,
    })

    return userClientFromPrismaToGraphQL(userClient)
  }

export default acceptClientInvite
