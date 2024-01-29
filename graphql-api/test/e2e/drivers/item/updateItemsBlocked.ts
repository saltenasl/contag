import type { Item, ObjectReference, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const mutateUpdateItemsBlocked = ({
  itemId,
  itemsBlockedAdded,
  itemsBlockedRemoved,
  loggedInAs,
}: {
  itemId: string
  itemsBlockedAdded: ObjectReference[]
  itemsBlockedRemoved: ObjectReference[]
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation UpdateItemsBlocked($itemId: ID!, $itemsBlockedAdded: [ObjectReference!]!, $itemsBlockedRemoved: [ObjectReference!]!) {
      updateItemsBlocked(itemId: $itemId, itemsBlockedAdded: $itemsBlockedAdded, itemsBlockedRemoved: $itemsBlockedRemoved) {
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
          blocks {
            ... on Message {
              id
            }

            ... on Task {
              id
            }

            ... on Question {
              id
            }

            ... on Info {
              id
            }

            ... on Goal {
              id
            }
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
          blocks {
            ... on Message {
              id
            }

            ... on Task {
              id
            }

            ... on Question {
              id
            }

            ... on Info {
              id
            }

            ... on Goal {
              id
            }
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
          blocks {
            ... on Message {
              id
            }

            ... on Task {
              id
            }

            ... on Question {
              id
            }

            ... on Info {
              id
            }

            ... on Goal {
              id
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
            }

            ... on Task {
              id
            }

            ... on Question {
              id
            }

            ... on Info {
              id
            }

            ... on Goal {
              id
            }
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
          blocks {
            ... on Message {
              id
            }

            ... on Task {
              id
            }

            ... on Question {
              id
            }

            ... on Info {
              id
            }

            ... on Goal {
              id
            }
          }
        }
      }
    }`,
    {
      variables: { itemId, itemsBlockedAdded, itemsBlockedRemoved },
      headers: authenticated(loggedInAs),
    }
  )
}

const updateItemsBlocked = async ({
  itemId,
  itemsBlockedAdded = [],
  itemsBlockedRemoved = [],
  loggedInAs,
}: {
  itemId: string
  itemsBlockedAdded?: ObjectReference[]
  itemsBlockedRemoved?: ObjectReference[]
  loggedInAs: User
}): Promise<Item> => {
  const response = await mutateUpdateItemsBlocked({
    itemId,
    itemsBlockedAdded,
    itemsBlockedRemoved,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { updateItemsBlocked: item },
  } = body

  return item
}

export default updateItemsBlocked
