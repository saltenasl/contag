import { ApolloCache } from '@apollo/client'
import { TypeName } from '@contag/graphql-api/src/constants'
import { ItemType, Message, Question, Task } from 'src/generated/graphql'
import { WithFieldsNormalized } from '../types'
import getObjectFromCache from './getObject'
import getObjectCacheReference from './getObjectCacheReference'

// todo make this dynamic from Item, currently ItemWithFieldsNormalized only leaves keys that are shared by Item types rather than extending all of them separately
type ItemWithFieldsNormalized =
  | WithFieldsNormalized<Message, 'author', 'to' | 'sharedWith'>
  | WithFieldsNormalized<Question, 'author', 'to' | 'sharedWith'>
  | WithFieldsNormalized<Task, 'author', 'to' | 'sharedWith'>

type ItemFromCache = {
  item: ItemWithFieldsNormalized | undefined
  itemRef: string | undefined
}

const getItemFromCache = (
  itemId: string,
  cache: ApolloCache<unknown>
): ItemFromCache => {
  const allItemTypes = Object.values(ItemType).map((type) => TypeName[type])

  return allItemTypes.reduce(
    (accumulator, typeName) => {
      if (accumulator.item) {
        return accumulator
      }

      const itemRef = getObjectCacheReference({ id: itemId, typeName, cache })
      const item = getObjectFromCache<ItemWithFieldsNormalized>({
        cache,
        objectRef: itemRef,
      })

      if (item) {
        return { itemRef, item }
      }

      return accumulator
    },
    <ItemFromCache>{ item: undefined, itemRef: undefined }
  )
}

export default getItemFromCache
