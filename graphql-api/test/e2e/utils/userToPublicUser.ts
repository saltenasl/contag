import type { User } from 'src/generated/graphql'

const userToPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  photoURL: user.photoURL,
})

export default userToPublicUser
