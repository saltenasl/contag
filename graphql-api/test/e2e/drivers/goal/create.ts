import { faker } from '@faker-js/faker'
import type {
  Goal,
  CreateGoalInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateCreateGoal = ({
  input,
  loggedInAs,
}: {
  input: CreateGoalInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation CreateGoal($input: CreateGoalInput!) {
      createGoal(input: $input) {
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

const createGoal = async ({
  author,
  shareWith,
  text = faker.lorem.sentence(),
  richText = JSON.parse(faker.datatype.json()),
  parentId = null,
  actionExpectation = {},
  to,
  attachments = [],
}: {
  author: User
  shareWith?: Array<User>
  text?: string
  richText?: object
  parentId?: Goal['parentId']
  actionExpectation?: CreateGoalInput['actionExpectation']
  to?: User[]
  attachments?: Attachment[]
}): Promise<Goal> => {
  const response = await mutateCreateGoal({
    input: {
      text,
      richText,
      parentId,
      ...(shareWith ? { shareWith: shareWith.map(({ id }) => ({ id })) } : {}),
      actionExpectation,
      to: to ? to.map(({ id }) => ({ id })) : null,
      attachments,
    },
    loggedInAs: author,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  const {
    data: { createGoal: goal },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return goal
}

export default createGoal
