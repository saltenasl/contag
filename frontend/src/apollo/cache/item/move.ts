import { ApolloCache } from '@apollo/client'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'

const moveToAnotherFeed = (
  cache: ApolloCache<unknown>,
  {
    movedFromFeedVariables,
    movedToFeedVariables,
    itemId,
  }: {
    movedFromFeedVariables: GetItemsQueryVariables
    movedToFeedVariables: GetItemsQueryVariables | undefined
    itemId: string
  }
) => {
  const movedFromFeed = cache.readQuery({
    query: GET_ITEMS,
    variables: movedFromFeedVariables,
  })

  const movedItem = movedFromFeed?.items?.find(({ id }) => itemId === id)
  if (!movedItem) {
    console.warn("Moved item not found in it's feed!")
    return
  }

  // delete item from the feed it was in before
  cache.writeQuery({
    query: GET_ITEMS,
    variables: movedFromFeedVariables,
    data: {
      items: movedFromFeed?.items?.filter(({ id }) => id !== itemId) || [],
    },
  })

  if (movedToFeedVariables) {
    const movedToFeed = cache.readQuery({
      query: GET_ITEMS,
      variables: movedToFeedVariables,
    })

    if (!movedToFeed?.items) {
      return
    }

    cache.writeQuery({
      query: GET_ITEMS,
      variables: movedToFeedVariables,
      data: {
        items: [
          {
            ...movedItem,
            parentId: movedToFeedVariables.filters.parentId,
          },
          ...movedToFeed.items,
        ],
      },
    })
  }
}

const cacheMoveItem = (
  cache: ApolloCache<unknown>,
  {
    movedFromFeedVariables,
    movedToFeedVariables,
    itemId,
  }: {
    movedFromFeedVariables: GetItemsQueryVariables
    movedToFeedVariables: GetItemsQueryVariables | undefined
    itemId: string
  }
) => {
  if (
    movedFromFeedVariables.filters.parentId !==
    movedToFeedVariables?.filters.parentId
  ) {
    moveToAnotherFeed(cache, {
      movedFromFeedVariables,
      movedToFeedVariables,
      itemId,
    })
  }
}

export default cacheMoveItem
