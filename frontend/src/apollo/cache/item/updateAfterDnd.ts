import { ApolloCache } from '@apollo/client'
import { TypeName } from '@contag/graphql-api/src/constants'
import getItemFromCache from '../utils/getItem'

const cacheUpdateItemAfterDnd = (
  cache: ApolloCache<unknown>,
  {
    itemId,
    oldParentId,
    newParentId,
  }: {
    itemId: string
    oldParentId: string
    newParentId: string
  }
) => {
  const { item, itemRef } = getItemFromCache(itemId, cache)

  if (!item) {
    console.warn(
      `Moved item "${itemId}" with computed reference "${itemRef}" not found in cache!`
    )
    return
  }

  const { item: oldParentItem, itemRef: oldParentItemRef } = oldParentId
    ? getItemFromCache(oldParentId, cache)
    : { item: undefined, itemRef: undefined }

  const { item: newParentItem } = newParentId
    ? getItemFromCache(newParentId, cache)
    : { item: undefined }

  const movedInSameFeed = oldParentId === newParentId

  if (!movedInSameFeed) {
    if (
      oldParentItemRef &&
      item.isAcceptedAnswer === true &&
      oldParentItem?.__typename === TypeName.QUESTION &&
      oldParentItem.acceptedAnswer
    ) {
      cache.modify({
        id: oldParentItemRef,
        fields: {
          acceptedAnswer() {
            return null
          },
        },
      })
    }

    if (
      oldParentItemRef &&
      item.isAcceptedAnswer === true &&
      oldParentItem?.__typename === TypeName.QUESTION &&
      oldParentItem.actionExpectation
    ) {
      cache.modify({
        id: oldParentItemRef,
        fields: {
          actionExpectation(actionExpectation) {
            return actionExpectation
              ? { ...actionExpectation, fulfilled: false }
              : actionExpectation
          },
        },
      })
    }

    cache.modify({
      id: itemRef,
      fields: {
        isAcceptedAnswer() {
          if (newParentItem?.__typename === TypeName.QUESTION) {
            return false
          }

          return null
        },
      },
    })
  }
}

export default cacheUpdateItemAfterDnd
