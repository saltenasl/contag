import { ApolloCache } from '@apollo/client'
import { TypeName } from '@contag/graphql-api/src/constants'

const cacheDeclineClientInvite = (
  cache: ApolloCache<unknown>,
  {
    clientInviteId,
  }: {
    clientInviteId: string
  }
) => {
  cache.evict({
    id: cache.identify({
      id: clientInviteId,
      __typename: TypeName.INVITE_TO_CLIENT,
    }),
  })
  cache.gc()
}

export default cacheDeclineClientInvite
