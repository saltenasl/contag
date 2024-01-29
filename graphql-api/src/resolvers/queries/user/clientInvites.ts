import { TypeName } from 'src/constants'
import listClientInvites from 'src/dal/clientInvite/list'
import type { Resolvers } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import userToPublicUser from 'src/transformers/userToPublicUser'
import transformEntityFromPrismaToGraphQL from '../../../transformers/entityFromPrismaToGraphQL'

const queryClientInvites: NonNullable<
  Required<Resolvers>['User']['clientInvites']
> = async (_, __, context) => {
  const clientInvites = await listClientInvites({
    prisma: context.prisma,
    email: context.user.email,
  })

  return clientInvites.map((invite) => ({
    __typename: TypeName.INVITE_TO_CLIENT,
    id: idFromPrismaToGraphQL(invite.id, TypeName.INVITE_TO_CLIENT),
    email: invite.email,
    client: transformEntityFromPrismaToGraphQL(invite.client, TypeName.CLIENT),
    invitedBy: userToPublicUser(invite.createdBy),
  }))
}

export default queryClientInvites
