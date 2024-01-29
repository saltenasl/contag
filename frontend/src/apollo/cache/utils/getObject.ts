import { ApolloCache } from '@apollo/client'

const getObjectFromCache = <ObjectType>({
  cache,
  objectRef,
}: {
  cache: ApolloCache<unknown>
  objectRef: string | undefined
}): ObjectType | undefined => {
  if (!objectRef) {
    return undefined
  }

  const normalizedCacheData = cache.extract() as Partial<
    Record<string, ObjectType>
  >

  if (objectRef in normalizedCacheData) {
    return normalizedCacheData[objectRef]
  }
}

export default getObjectFromCache
