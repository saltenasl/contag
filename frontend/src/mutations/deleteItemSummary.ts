import { gql } from 'src/generated'

const DELETE_ITEM_SUMMARY = gql(`
  mutation DeleteItemSummary($itemId: ID!) {
    deleteItemSummary(itemId: $itemId) {
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
      }
    }
  }`)

export default DELETE_ITEM_SUMMARY
