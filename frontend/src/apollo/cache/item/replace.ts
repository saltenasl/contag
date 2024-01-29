import { ApolloCache } from '@apollo/client'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'
import { Item } from 'src/types'

const cacheReplaceItemInFeed = ({
  cache,
  newItem,
  oldItem,
  feedVariables,
}: {
  cache: ApolloCache<unknown>
  newItem: Item
  oldItem: Item
  feedVariables: GetItemsQueryVariables
}) => {
  const data = cache.readQuery({ query: GET_ITEMS, variables: feedVariables })

  if (data?.items) {
    cache.writeQuery({
      query: GET_ITEMS,
      variables: feedVariables,
      data: {
        items: data.items.map((item) => {
          if (item.id === oldItem.id) {
            return newItem
          }

          return item
        }),
      },
    })
  }
}

export default cacheReplaceItemInFeed
