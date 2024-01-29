import { gql } from 'src/generated'

const CREATE_QUESTION = gql(`
  mutation CreateQuestion($input: CreateQuestionInput!) {
    createQuestion(input: $input) {
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

export default CREATE_QUESTION
