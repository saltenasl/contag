import { ApolloCache } from '@apollo/client'
import { GetMyProfileQuery, UsersClient } from 'src/generated/graphql'
import { GET_MY_PROFILE } from 'src/queries/getMyProfile'

const cacheAcceptClientInvite = (
  cache: ApolloCache<unknown>,
  {
    clientInviteId,
    myProfile,
    newUsersClient,
  }: {
    clientInviteId: string
    myProfile: GetMyProfileQuery['myProfile']
    newUsersClient: UsersClient
  }
) => {
  cache.writeQuery({
    query: GET_MY_PROFILE,
    data: {
      myProfile: {
        ...myProfile,
        clientInvites: myProfile.clientInvites.filter(
          ({ id: inviteId }) => clientInviteId !== inviteId
        ),
        clients: [newUsersClient, ...myProfile.clients],
      },
    },
  })
}

export default cacheAcceptClientInvite
