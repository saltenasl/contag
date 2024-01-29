import type { Goal, ObjectReference, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const mutateUpdateItemGoals = ({
  itemId,
  goalsAdded,
  goalsRemoved,
  loggedInAs,
}: {
  itemId: string
  goalsAdded: ObjectReference[]
  goalsRemoved: ObjectReference[]
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation UpdateItemGoals($itemId: ID!, $goalsAdded: [ObjectReference!]!, $goalsRemoved: [ObjectReference!]!) {
      updateItemGoals(itemId: $itemId, goalsAdded: $goalsAdded, goalsRemoved: $goalsRemoved) {
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
          goals {
            id
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
          goals {
            id
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
          goals {
            id
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
          goals {
            id
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
          goals {
            id
          }
        }
      }
    }`,
    {
      variables: { itemId, goalsAdded, goalsRemoved },
      headers: authenticated(loggedInAs),
    }
  )
}

const updateItemGoals = async ({
  itemId,
  goalsAdded = [],
  goalsRemoved = [],
  loggedInAs,
}: {
  itemId: string
  goalsAdded?: ObjectReference[]
  goalsRemoved?: ObjectReference[]
  loggedInAs: User
}): Promise<Goal> => {
  const response = await mutateUpdateItemGoals({
    itemId,
    goalsAdded,
    goalsRemoved,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { updateItemGoals: item },
  } = body

  return item
}

export default updateItemGoals
