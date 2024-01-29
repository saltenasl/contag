import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import { useIsPollingEnabled } from 'src/PollContext'
import { POLL_ITEMS_INTERVAL } from './getItems'

export const GET_CHILDREN = gql(`
  query GetChildren($sort: ItemsSort!, $filters: ItemsFilters!) {
    items(sort: $sort, filters: $filters) {
      ... on Message {
        id
        text
        richText
        to {
          id
          name
          email
          photoURL
        }
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
        to {
          id
          name
          email
          photoURL
        }
        status
        childCount
        actionExpectation {
          type
          completeUntil
          fulfilled
        }
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
        to {
          id
          name
          email
          photoURL
        }
        actionExpectation {
          type
          completeUntil
          fulfilled
        }
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
        acknowledged
        to {
          id
          email
          name
          photoURL
        }
        actionExpectation {
          type
          completeUntil
          fulfilled
        }
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
        to {
          id
          name
          email
          photoURL
        }
        goalStatus
        childCount
        actionExpectation {
          type
          completeUntil
          fulfilled
        }
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
      }
    }
  }`)

const useGetChildrenItems = (parentId: string) => {
  const isPollingEnabled = useIsPollingEnabled()

  const { client, data, loading, error } = useQuery(GET_CHILDREN, {
    variables: {
      sort: {
        order: ItemsSortOrder.NewestFirst,
        type: ItemsSortType.CreatedAt,
      },
      filters: {
        parentId,
      },
    },
    pollInterval: isPollingEnabled ? POLL_ITEMS_INTERVAL : undefined,
  })

  return { client, children: data?.items, loading, error }
}

export default useGetChildrenItems
