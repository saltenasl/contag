import { gql } from 'src/generated'

const CREATE_TASK = gql(`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      parentId
      author {
        id
        email
        name
        photoURL
      }
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
      text
      richText
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
        text
        richText
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
  }`)

export default CREATE_TASK
