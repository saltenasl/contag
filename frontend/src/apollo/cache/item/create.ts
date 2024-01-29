import { ApolloCache } from '@apollo/client'
import { ItemsSortOrder, GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'
import { Item } from 'src/types'

const cacheCreateItem = (
  cache: ApolloCache<unknown>,
  {
    newItem,
    variables,
    parentFeedVariables,
    parentId,
  }: {
    newItem: Item
    variables: GetItemsQueryVariables
    parentFeedVariables: GetItemsQueryVariables | null
    parentId: string
  }
) => {
  const itemFeedData = cache.readQuery({
    query: GET_ITEMS,
    variables,
  })

  if (!itemFeedData?.items) {
    console.warn('Feed of the created item is not defined!')
    return
  }

  const updatedItems =
    variables.sort.order === ItemsSortOrder.OldestFirst
      ? [...itemFeedData.items, newItem]
      : [newItem, ...itemFeedData.items]

  cache.writeQuery({
    query: GET_ITEMS,
    data: {
      items: updatedItems,
    },
    variables,
  })

  if (parentFeedVariables) {
    const parentFeedData = cache.readQuery({
      query: GET_ITEMS,
      variables: parentFeedVariables,
    })

    if (parentFeedData?.items) {
      cache.writeQuery({
        query: GET_ITEMS,
        data: {
          items: parentFeedData.items.map((item) => {
            if (!('childCount' in item) || item.id !== parentId) {
              return item
            }

            return {
              ...item,
              childCount: item.childCount + 1,
            }
          }),
        },
        variables: parentFeedVariables,
      })
    }
  }
}

export default cacheCreateItem
