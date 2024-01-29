import type { Item, ItemsFilters, ItemsSort, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const queryItems = ({
  loggedInAs,
  sort,
  filters,
}: {
  loggedInAs?: User | undefined
  sort: ItemsSort
  filters: ItemsFilters
}) =>
  request(
    `#graphql
    query GetItems($sort: ItemsSort!, $filters: ItemsFilters!) {
      items(sort: $sort, filters: $filters) {
        ... on Message {
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
            email
            name
            photoURL
          }
          text
          richText
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
            email
            name
            photoURL
          }
          text
          richText
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
            email
            name
            photoURL
          }
          text
          richText
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
    }`,
    { headers: authenticated(loggedInAs), variables: { sort, filters } }
  )

const getItems = async ({
  loggedInAs,
  sort,
  filters,
}: {
  loggedInAs?: User
  sort: ItemsSort
  filters: ItemsFilters
}): Promise<Item[]> => {
  const response = await queryItems({ loggedInAs, sort, filters })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { items },
  } = body

  return items
}

export default getItems
