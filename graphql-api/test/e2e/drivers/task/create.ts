import { faker } from '@faker-js/faker'
import type {
  Task,
  CreateTaskInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateCreateTask = ({
  input,
  loggedInAs,
}: {
  input: CreateTaskInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
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

const createTask = async ({
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
  parentId?: Task['parentId']
  actionExpectation?: CreateTaskInput['actionExpectation']
  to?: User[]
  attachments?: Attachment[]
}): Promise<Task> => {
  const response = await mutateCreateTask({
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
    data: { createTask: task },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return task
}

export default createTask
