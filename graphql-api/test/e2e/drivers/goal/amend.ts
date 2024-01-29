import type {
  Goal,
  GoalStatus,
  AmendGoalInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAmendGoal = ({
  input,
  loggedInAs,
}: {
  input: AmendGoalInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AmendGoal($input: AmendGoalInput!) {
      amendGoal(input: $input) {
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
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const amendGoal = async ({
  loggedInAs,
  id,
  goalStatus,
  actionExpectation,
  to,
  sharedWith,
  attachments,
}: {
  loggedInAs: User
  id: string
  goalStatus?: GoalStatus
  actionExpectation?: AmendGoalInput['actionExpectation']
  to?: User[]
  sharedWith?: User[]
  attachments?: Attachment[]
}): Promise<Goal> => {
  const response = await mutateAmendGoal({
    input: {
      id,
      ...(goalStatus ? { goalStatus } : {}),
      ...(actionExpectation !== undefined ? { actionExpectation } : {}),
      ...(to ? { to: to.map(({ id }) => ({ id })) } : {}),
      ...(sharedWith
        ? { sharedWith: sharedWith.map(({ id }) => ({ id })) }
        : {}),
      ...(attachments ? { attachments } : {}),
    },
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  const {
    data: { amendGoal: goal },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return goal
}

export default amendGoal
