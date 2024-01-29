import type { User } from '@prisma/client'
import { TypeName } from 'src/constants'
import type { PublicUser } from 'src/generated/graphql'
import transformEntityFromPrismaToGraphQL from './entityFromPrismaToGraphQL'

const userToPublicUser = ({
  id,
  photoURL,
  name,
  email,
  active,
}: User & { active?: boolean | undefined }): PublicUser => ({
  __typename: TypeName.PUBLIC_USER,
  ...transformEntityFromPrismaToGraphQL(
    { id, photoURL, name, email },
    TypeName.USER
  ),
  active: active === undefined ? null : active,
})

export default userToPublicUser
