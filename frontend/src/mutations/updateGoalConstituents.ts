import { gql } from 'src/generated'

const UPDATE_GOAL_CONSTITUENTS = gql(`
mutation UpdateGoalConstituents($itemId: ID!, $constituentsAdded: [ObjectReference!]!, $constituentsRemoved: [ObjectReference!]!) {
  updateGoalConstituents(itemId: $itemId, constituentsAdded: $constituentsAdded, constituentsRemoved: $constituentsRemoved) {
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
`)

export default UPDATE_GOAL_CONSTITUENTS
