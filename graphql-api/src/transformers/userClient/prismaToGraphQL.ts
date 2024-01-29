import { TypeName } from 'src/constants'
import type { UsersClient } from 'src/generated/graphql'
import type { User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import prismaUserClientRoleToGraphQL from '../userClientRole/prismaToGraphQL'

const userClientFromPrismaToGraphQL = ({
  client,
  role,
  addedBy,
}: User['userClients'][number]): UsersClient => ({
  __typename: TypeName.USERS_CLIENT,
  ...transformEntityFromPrismaToGraphQL(
    {
      ...client,
      role: prismaUserClientRoleToGraphQL(role),
      addedBy: addedBy
        ? {
            __typename: TypeName.PUBLIC_USER as const,
            ...transformEntityFromPrismaToGraphQL(
              {
                id: addedBy.id,
                email: addedBy.email,
                name: addedBy.name,
                photoURL: addedBy.photoURL,
                active: null,
              },
              TypeName.USER
            ),
          }
        : null,
    },
    TypeName.CLIENT
  ),
})

export default userClientFromPrismaToGraphQL
