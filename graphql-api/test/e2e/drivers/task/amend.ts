import type {
  Task,
  TaskStatus,
  AmendTaskInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAmendTask = ({
  input,
  loggedInAs,
}: {
  input: AmendTaskInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AmendTask($input: AmendTaskInput!) {
      amendTask(input: $input) {
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

const amendTask = async ({
  author, // todo - rename to loggedInAs
  id,
  status,
  actionExpectation,
  to,
  sharedWith,
  attachments,
}: {
  author: User
  id: string
  status?: TaskStatus
  actionExpectation?: AmendTaskInput['actionExpectation']
  to?: User[]
  sharedWith?: User[]
  attachments?: Attachment[]
}): Promise<Task> => {
  const response = await mutateAmendTask({
    input: {
      id,
      ...(status ? { status } : {}),
      ...(actionExpectation !== undefined ? { actionExpectation } : {}),
      ...(to ? { to: to.map(({ id }) => ({ id })) } : {}),
      ...(sharedWith
        ? { sharedWith: sharedWith.map(({ id }) => ({ id })) }
        : {}),
      ...(attachments ? { attachments } : {}),
    },
    loggedInAs: author,
  })

  expect(response.status).toBe(200)

  const body = await response.json()
  const {
    data: { amendTask: task },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return task
}

export default amendTask
