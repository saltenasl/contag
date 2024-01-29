import type {
  Question,
  AmendQuestionInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAmendQuestion = ({
  input,
  loggedInAs,
}: {
  input: AmendQuestionInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AmendQuestion($input: AmendQuestionInput!) {
      amendQuestion(input: $input) {
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
        childCount
        createdAt
        updatedAt
        isAcceptedAnswer
        acceptedAnswer {
          text
          richText
        }
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

const amendQuestion = async ({
  author, // todo - rename to loggedInAs
  id,
  text,
  richText,
  actionExpectation,
  to,
  sharedWith,
  attachments,
}: {
  author: User
  id: string
  text?: string
  richText?: object
  actionExpectation?: AmendQuestionInput['actionExpectation']
  to?: User[]
  sharedWith?: User[]
  attachments?: Attachment[]
}): Promise<Question> => {
  const response = await mutateAmendQuestion({
    input: {
      id,
      ...(text !== undefined ? { text } : {}),
      ...(richText !== undefined ? { richText } : {}),
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

  const {
    data: { amendQuestion: question },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return question
}

export default amendQuestion
