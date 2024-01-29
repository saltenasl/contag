import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import deleteClientInvite from 'src/dal/clientInvite/delete'
import getClientInvite from 'src/dal/clientInvite/get'
import type { MutationResolvers } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { User } from 'src/types'

const validate = async ({
  prisma,
  id,
  currentUser,
}: {
  prisma: PrismaClient
  id: number
  currentUser: User
}) => {
  const invite = await getClientInvite({
    prisma,
    id,
  })

  if (!invite || invite.email !== currentUser.email) {
    throw new GraphQLError('Invite not found')
  }
}

const declineClientInvite: Required<MutationResolvers>['declineClientInvite'] =
  async (_, args, context) => {
    const id = idFromGraphQLToPrisma(args.inviteId)

    await validate({ prisma: context.prisma, id, currentUser: context.user })

    await deleteClientInvite({ prisma: context.prisma, id })

    return {
      success: true,
    }
  }

export default declineClientInvite
