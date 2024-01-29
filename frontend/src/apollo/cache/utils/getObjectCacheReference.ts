import { ApolloCache } from '@apollo/client'

const getObjectCacheReference = ({
  id,
  cache,
  typeName: __typename,
}: {
  id: string
  cache: ApolloCache<unknown>
  typeName: string
}) =>
  cache.identify({
    id,
    __typename,
  })

export default getObjectCacheReference
