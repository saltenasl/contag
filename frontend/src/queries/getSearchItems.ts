import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { ItemTypeFilters, SearchItemsQuery } from 'src/generated/graphql'
import { SEARCH_ITEMS_SORT } from './getSearchResults'

export const GET_SEARCH_ITEMS = gql(`
  query SearchItems($sort: ItemsSort!, $filters: ItemsFilters!) {
    items(sort: $sort, filters: $filters) {
      ... on Message {
        id
        text
        richText
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }

      ... on Task {
        id
        text
        richText
        status
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }

      ... on Question {
        id
        text
        richText
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }

      ... on Info {
        id
        text
        richText
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }

      ... on Goal {
        id
        text
        richText
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }
    }
  }`)
export type Item = SearchItemsQuery['items'][number]

export type Goal = Extract<
  SearchItemsQuery['items'][number],
  { __typename?: 'Goal' }
>

const useGetSearchItems = ({
  search,
  itemType = null,
  skip = false,
}: {
  search: string
  skip?: boolean
  itemType?: ItemTypeFilters | null
}) => {
  const { client, data, loading, error } = useQuery(GET_SEARCH_ITEMS, {
    variables: { sort: SEARCH_ITEMS_SORT, filters: { search, itemType } },
    skip,
  })

  return { client, items: data?.items, loading, error }
}

export default useGetSearchItems
