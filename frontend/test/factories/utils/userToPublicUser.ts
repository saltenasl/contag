import { PublicUser, User } from 'src/generated/graphql'

const userToPublicUser = (user: User): PublicUser => ({
  __typename: 'PublicUser',
  id: user.id,
  email: user.email,
  name: user.name,
  photoURL: user.photoURL,
  active: null,
})

export default userToPublicUser
