import type { User, Item } from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateDeleteItemSummary = ({
  itemId,
  loggedInAs,
}: {
  itemId: string
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation DeleteItemSummary($itemId: ID!) {
      deleteItemSummary(itemId: $itemId) {
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
        }
      }
    }`,
    {
      variables: {
        itemId,
      },
      headers: authenticated(loggedInAs),
    }
  )
}

const deleteItemSummary = async ({
  itemId,
  loggedInAs,
}: {
  itemId: string
  text?: string
  shouldReplaceOriginalItem?: boolean
  loggedInAs: User
}): Promise<Item> => {
  const response = await mutateDeleteItemSummary({
    itemId,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { deleteItemSummary: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default deleteItemSummary
