import { ApolloCache } from '@apollo/client'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'
import { Item } from 'src/types'

const cacheConvertItemFromQuestion = (
  cache: ApolloCache<unknown>,
  {
    item,
    childFeedVariables,
  }: {
    item: Item
    childFeedVariables: GetItemsQueryVariables | null
  }
) => {
  if (childFeedVariables && childFeedVariables.filters.parentId === item.id) {
    const childFeedData = cache.readQuery({
      query: GET_ITEMS,
      variables: childFeedVariables,
    })

    if (childFeedData?.items) {
      cache.writeQuery({
        query: GET_ITEMS,
        variables: childFeedVariables,
        data: {
          items: childFeedData.items.map((item) => ({
            ...item,
            isAcceptedAnswer: null,
          })),
        },
      })
    }
  }
}

export default cacheConvertItemFromQuestion
