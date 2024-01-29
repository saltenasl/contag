import { ClientRole } from '@prisma/client'
import { UserClientRole } from 'src/generated/graphql'

const prismaUserClientRoleToGraphQL = (role: ClientRole): UserClientRole => {
  switch (role) {
    case ClientRole.ADMIN:
      return UserClientRole.Admin
    case ClientRole.OWNER:
      return UserClientRole.Owner
    case ClientRole.MEMBER:
      return UserClientRole.Member
    default:
      throw new Error('Unknown Client Role')
  }
}

export default prismaUserClientRoleToGraphQL
