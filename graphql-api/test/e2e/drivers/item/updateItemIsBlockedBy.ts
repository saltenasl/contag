import type { Item, ObjectReference, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const mutateUpdateItemIsBlockedBy = ({
  itemId,
  blockedByAdded,
  blockedByRemoved,
  loggedInAs,
}: {
  itemId: string
  blockedByAdded: ObjectReference[]
  blockedByRemoved: ObjectReference[]
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation UpdateItemIsBlockedBy($itemId: ID!, $blockedByAdded: [ObjectReference!]!, $blockedByRemoved: [ObjectReference!]!) {
      updateItemIsBlockedBy(itemId: $itemId, blockedByAdded: $blockedByAdded, blockedByRemoved: $blockedByRemoved) {
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
          blockedBy {
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
          blockedBy {
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
          blockedBy {
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
          blockedBy {
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
          blockedBy {
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
      variables: { itemId, blockedByAdded, blockedByRemoved },
      headers: authenticated(loggedInAs),
    }
  )
}

const updateItemIsBlockedBy = async ({
  itemId,
  blockedByAdded = [],
  blockedByRemoved = [],
  loggedInAs,
}: {
  itemId: string
  blockedByAdded?: ObjectReference[]
  blockedByRemoved?: ObjectReference[]
  loggedInAs: User
}): Promise<Item> => {
  const response = await mutateUpdateItemIsBlockedBy({
    itemId,
    blockedByAdded,
    blockedByRemoved,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { updateItemIsBlockedBy: item },
  } = body

  return item
}

export default updateItemIsBlockedBy
