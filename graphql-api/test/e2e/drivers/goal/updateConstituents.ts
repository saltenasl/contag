import type { Goal, ObjectReference, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const mutateUpdateGoalConstituents = ({
  itemId,
  constituentsAdded,
  constituentsRemoved,
  loggedInAs,
}: {
  itemId: string
  constituentsAdded: ObjectReference[]
  constituentsRemoved: ObjectReference[]
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation UpdateGoalConstituents($itemId: ID!, $constituentsAdded: [ObjectReference!]!, $constituentsRemoved: [ObjectReference!]!) {
      updateGoalConstituents(itemId: $itemId, constituentsAdded: $constituentsAdded, constituentsRemoved: $constituentsRemoved) {
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
        constituents {
          ... on Message {
            id
          }

          ... on Task {
            id
          }

          ... on Info {
            id
          }

          ... on Question {
            id
          }

          ... on Goal {
            id
          }
        }
      }
    }`,
    {
      variables: { itemId, constituentsAdded, constituentsRemoved },
      headers: authenticated(loggedInAs),
    }
  )
}

const updateGoalConstituents = async ({
  itemId,
  constituentsAdded = [],
  constituentsRemoved = [],
  loggedInAs,
}: {
  itemId: string
  constituentsAdded?: ObjectReference[]
  constituentsRemoved?: ObjectReference[]
  loggedInAs: User
}): Promise<Goal> => {
  const response = await mutateUpdateGoalConstituents({
    itemId,
    constituentsAdded,
    constituentsRemoved,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { updateGoalConstituents: goal },
  } = body

  return goal
}

export default updateGoalConstituents
