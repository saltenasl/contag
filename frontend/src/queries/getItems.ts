import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { ItemsFilters, ItemsSort } from 'src/generated/graphql'
import { useIsPollingEnabled } from 'src/PollContext'

export const POLL_ITEMS_INTERVAL = 3000

export const GET_ITEMS = gql(`
  query GetItems($sort: ItemsSort!, $filters: ItemsFilters!) {
    items(sort: $sort, filters: $filters) {
      ... on Message {
        id
        parentId
        author {
          id
          name
          email
          photoURL
        }
        text
        richText
        to {
          id
          name
          email
          photoURL
        }
        sharedWith {
          id
          name
          email
          photoURL
        }
        createdAt
        updatedAt
        childCount
        isAcceptedAnswer
        summary {
          text
          richText
          shouldReplaceOriginalItem
        }
        attachments {
          id
          filename
          originalName
          contentType
          size
        }
        blocks {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blockedBy {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
      }

      ... on Task {
        id
        parentId
        author {
          id
          name
          email
          photoURL
        }
        text
        richText
        to {
          id
          name
          email
          photoURL
        }
        sharedWith {
          id
          name
          email
          photoURL
        }
        status
        createdAt
        updatedAt
        childCount
        isAcceptedAnswer
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
        attachments {
          id
          filename
          originalName
          contentType
          size
        }
        blocks {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blockedBy {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
      }

      ... on Question {
        id
        parentId
        author {
          id
          name
          email
          photoURL
        }
        text
        richText
        to {
          id
          name
          email
          photoURL
        }
        sharedWith {
          id
          name
          email
          photoURL
        }
        acceptedAnswer {
          text
          richText
        }
        childCount
        createdAt
        updatedAt
        isAcceptedAnswer
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
        attachments {
          id
          filename
          originalName
          contentType
          size
        }
        blocks {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blockedBy {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
      }

      ... on Info {
        id
        parentId
        author {
          id
          email
          name
          photoURL
        }
        text
        richText
        acknowledged
        to {
          id
          email
          name
          photoURL
        }
        sharedWith {
          id
          email
          name
          photoURL
        }
        childCount
        createdAt
        updatedAt
        isAcceptedAnswer
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
        attachments {
          id
          filename
          originalName
          contentType
          size
        }
        blocks {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blockedBy {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
      }

      ... on Goal {
        id
        parentId
        author {
          id
          name
          email
          photoURL
        }
        text
        richText
        to {
          id
          name
          email
          photoURL
        }
        sharedWith {
          id
          name
          email
          photoURL
        }
        goalStatus
        createdAt
        updatedAt
        childCount
        isAcceptedAnswer
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
        attachments {
          id
          filename
          originalName
          contentType
          size
        }
        constituents {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blocks {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
        blockedBy {
          ... on Message {
            id
            text
            richText
            summary {
              text
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
              shouldReplaceOriginalItem
            }
          }

          ... on Question {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Info {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }

          ... on Goal {
            id
            text
            richText
            summary {
              text
              shouldReplaceOriginalItem
            }
          }
        }
      }
    }
  }`)

const useGetItems = ({
  filters,
  sort,
  skip = false,
  dontPoll = false,
}: {
  filters: ItemsFilters
  sort: ItemsSort
  skip?: boolean
  dontPoll?: boolean
}) => {
  const isPollingEnabled = useIsPollingEnabled()

  const { client, data, loading, error } = useQuery(GET_ITEMS, {
    variables: {
      sort,
      filters,
    },
    pollInterval:
      isPollingEnabled && !dontPoll ? POLL_ITEMS_INTERVAL : undefined,
    skip,
  })

  return { client, items: data?.items, loading, error }
}

export default useGetItems
