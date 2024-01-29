import type { Item, User } from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const queryItem = ({
  loggedInAs,
  id,
}: {
  loggedInAs?: User | undefined
  id: string
}) =>
  request(
    `#graphql
    query GetItem($id: ID!) {
      item(id: $id) {
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
    { headers: authenticated(loggedInAs), variables: { id } }
  )

const getItem = async ({
  loggedInAs,
  id,
}: {
  loggedInAs: User
  id: string
}): Promise<Item> => {
  const response = await queryItem({ loggedInAs, id })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { item },
  } = body

  return item
}

export default getItem
