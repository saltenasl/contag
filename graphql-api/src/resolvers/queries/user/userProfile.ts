import { TypeName } from 'src/constants'
import type { QueryResolvers } from 'src/generated/graphql'
import userClientFromPrismaToGraphQL from 'src/transformers/userClient/prismaToGraphQL'
import transformEntityFromPrismaToGraphQL from '../../../transformers/entityFromPrismaToGraphQL'

const queryUserProfile: Required<QueryResolvers>['myProfile'] = async (
  _,
  __,
  context
) => {
  const user = context.user

  return {
    ...transformEntityFromPrismaToGraphQL(user, TypeName.USER),
    photoURL: user.photoURL ? new URL(user.photoURL) : null,
    clients: user.userClients.map(userClientFromPrismaToGraphQL),
  }
}

export default queryUserProfile
