import { ApolloCache } from '@apollo/client'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'
import { Item } from 'src/types'
import cacheUpdatedAnswer from './cacheUpdatedAnswer'

const cacheAcceptAnswer = (
  cache: ApolloCache<unknown>,
  {
    item,
    feedVariables,
    parentFeedVariables,
  }: {
    item: Item
    feedVariables: GetItemsQueryVariables
    parentFeedVariables: GetItemsQueryVariables | null
  }
) => {
  cacheUpdatedAnswer(cache, {
    answer: item,
    parentFeedVariables,
  })

  const itemFeedData = cache.readQuery({
    query: GET_ITEMS,
    variables: feedVariables,
  })

  if (itemFeedData?.items) {
    cache.writeQuery({
      query: GET_ITEMS,
      variables: feedVariables,
      data: {
        items: itemFeedData.items.map((cachedItem) => {
          if (cachedItem.id === item.id) {
            return cachedItem
          }

          return {
            ...cachedItem,
            isAcceptedAnswer: false,
          }
        }),
      },
    })
  } else {
    console.warn('Feed for item marked as correct answer not found!')
  }
}

export default cacheAcceptAnswer
