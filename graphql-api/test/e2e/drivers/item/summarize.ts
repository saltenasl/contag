import { faker } from '@faker-js/faker'
import type { User, Item } from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateSummarizeItem = ({
  itemId,
  text,
  shouldReplaceOriginalItem,
  richText,
  loggedInAs,
}: {
  itemId: string
  text: string
  richText?: object
  shouldReplaceOriginalItem: boolean
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation SummarizeItem($itemId: ID!, $text: String!, $shouldReplaceOriginalItem: Boolean!, $richText: JSONObject) {
      summarizeItem(itemId: $itemId, text: $text, shouldReplaceOriginalItem: $shouldReplaceOriginalItem, richText: $richText) {
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
    {
      variables: {
        itemId,
        text,
        shouldReplaceOriginalItem,
        richText,
      },
      headers: authenticated(loggedInAs),
    }
  )
}

const summarizeItem = async ({
  itemId,
  text = faker.lorem.sentence(),
  shouldReplaceOriginalItem = false,
  loggedInAs,
}: {
  itemId: string
  text?: string
  shouldReplaceOriginalItem?: boolean
  loggedInAs: User
}): Promise<Item> => {
  const response = await mutateSummarizeItem({
    itemId,
    text,
    shouldReplaceOriginalItem,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { summarizeItem: result },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return result
}

export default summarizeItem
