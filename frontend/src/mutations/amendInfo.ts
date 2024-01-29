import { gql } from 'src/generated'

const AMEND_INFO = gql(`
  mutation AmendInfo($input: AmendInfoInput!) {
    amendInfo(input: $input) {
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

export default AMEND_INFO
