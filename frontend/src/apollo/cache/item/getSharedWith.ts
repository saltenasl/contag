import { ApolloCache } from '@apollo/client'
import { TypeName } from '@contag/graphql-api/src/constants'
import { PublicUser } from 'src/generated/graphql'
import getItemFromCache from '../utils/getItem'
import getObjectFromCache from '../utils/getObject'
import getObjectCacheReference from '../utils/getObjectCacheReference'

const getSharedWithFromCache = (
  cache: ApolloCache<unknown>,
  parentId: string | undefined | null
): PublicUser[] => {
  if (!parentId) {
    console.warn(
      'non-string value for parentId passed to getSharedWithFromCache',
      { parentId }
    )

    return []
  }

  const publicUserParent = getObjectFromCache<PublicUser>({
    cache,
    objectRef: getObjectCacheReference({
      cache,
      id: parentId,
      typeName: TypeName.PUBLIC_USER,
    }),
  })

  if (publicUserParent) {
    return [publicUserParent]
  }

  const { item } = getItemFromCache(parentId, cache)

  if (item) {
    return item.sharedWith
      .map(({ __ref: objectRef }) =>
        getObjectFromCache<PublicUser>({
          cache,
          objectRef,
        })
      )
      .filter(
        (item: PublicUser | undefined): item is PublicUser => item !== undefined
      )
  }

  console.warn('parent item not found in cache in getSharedWithFromCache!', {
    parentId,
  })

  return []
}

export default getSharedWithFromCache
