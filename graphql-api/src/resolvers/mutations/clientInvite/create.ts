import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { TypeName } from 'src/constants'
import saveClientInvite from 'src/dal/clientInvite/save'
import getUserByEmailFromClient from 'src/dal/user/getByEmailFromClient'
import type {
  InviteToClientInput,
  MutationResolvers,
} from 'src/generated/graphql'
import { UserClientRole } from 'src/generated/graphql'
import transformEntityFromPrismaToGraphQL from 'src/transformers/entityFromPrismaToGraphQL'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import userToPublicUser from 'src/transformers/userToPublicUser'
import type { User } from 'src/types'

const validate = async ({
  prisma,
  currentUser,
  clientId,
  input,
}: {
  prisma: PrismaClient
  currentUser: User
  clientId: number
  input: InviteToClientInput
}) => {
  const userClient = currentUser.userClients.find(
    ({ client: { id } }) => clientId === id
  )
  if (!userClient || userClient.role !== UserClientRole.Owner) {
    throw new GraphQLError('Unauthorized')
  }

  const toBeInvitedUser = await getUserByEmailFromClient({
    prisma: prisma,
    email: input.email,
    clientId,
  })

  if (toBeInvitedUser) {
    throw new GraphQLError('User is already in the client')
  }
}

const inviteToClient: Required<MutationResolvers>['inviteToClient'] = async (
  _,
  args,
  context
) => {
  const clientId = idFromGraphQLToPrisma(args.input.clientId)

  await validate({
    prisma: context.prisma,
    currentUser: context.user,
    clientId,
    input: args.input,
  })

  const invite = await saveClientInvite({
    clientId,
    currentUserId: context.user.id,
    email: args.input.email,
    prisma: context.prisma,
  })

  return {
    __typename: TypeName.INVITE_TO_CLIENT,
    id: idFromPrismaToGraphQL(invite.id, TypeName.INVITE_TO_CLIENT),
    email: invite.email,
    client: transformEntityFromPrismaToGraphQL(invite.client, TypeName.CLIENT),
    invitedBy: userToPublicUser(context.user),
  }
}

export default inviteToClient
