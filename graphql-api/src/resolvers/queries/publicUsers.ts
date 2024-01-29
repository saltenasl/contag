import listUsersFromClients from 'src/dal/user/listFromClients'
import type { QueryResolvers } from 'src/generated/graphql'
import userToPublicUser from 'src/transformers/userToPublicUser'

const queryPublicUsers: Required<QueryResolvers>['publicUsers'] = async (
  _,
  args,
  context
) => {
  const { user: currentUser, prisma } = context

  const currentUserClientIds = currentUser.userClients.map(
    ({ client: { id } }) => id
  )

  const users = await listUsersFromClients({
    prisma,
    clientIds: currentUserClientIds,
    currentUserId: currentUser.id,
    search: args.filters?.search,
  })

  const includeCurrentUser = !args.filters?.search

  if (includeCurrentUser) {
    return [{ ...currentUser, active: true }, ...users].map(userToPublicUser)
  }

  return users.map(userToPublicUser)
}

export default queryPublicUsers
