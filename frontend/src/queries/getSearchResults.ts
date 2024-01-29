import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'

export const POLL_ITEMS_INTERVAL = 3000

export const GET_SEARCH_RESULTS = gql(`
  query GetSearchResults($itemsSort: ItemsSort!, $itemsFilters: ItemsFilters!, $publicUsersFilters: PublicUsersFilters!) {
    publicUsers(filters: $publicUsersFilters) {
      id
      email
      name
      photoURL
      active
    }


    items(sort: $itemsSort, filters: $itemsFilters) {
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
      }
    }
  }`)

export const SEARCH_ITEMS_SORT = {
  type: ItemsSortType.CreatedAt,
  order: ItemsSortOrder.NewestFirst,
}

const useGetSearchResults = ({
  search,
  skip = false,
}: {
  search: string
  skip?: boolean
}) => {
  const { data, loading, error } = useQuery(GET_SEARCH_RESULTS, {
    variables: {
      itemsFilters: { search },
      publicUsersFilters: { search },
      itemsSort: SEARCH_ITEMS_SORT,
    },
    skip,
  })

  return { items: data?.items, publicUsers: data?.publicUsers, loading, error }
}

export default useGetSearchResults
