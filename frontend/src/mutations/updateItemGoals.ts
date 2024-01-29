import { gql } from 'src/generated'

const UPDATE_ITEM_GOALS = gql(`
mutation UpdateItemGoals($itemId: ID!, $goalsAdded: [ObjectReference!]!, $goalsRemoved: [ObjectReference!]!) {
  updateItemGoals(itemId: $itemId, goalsAdded: $goalsAdded, goalsRemoved: $goalsRemoved) {
    ... on Message {
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
        text
        richText
      }
    }

    ... on Task {
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
    }

    ... on Question {
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
        text
        richText
      }
    }

    ... on Goal {
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
      constituents {
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
      goals {
        id
        text
        richText
      }
    }
  }
}
`)

export default UPDATE_ITEM_GOALS
