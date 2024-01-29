import { faker } from '@faker-js/faker'
import type {
  Question,
  CreateQuestionInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateCreateQuestion = ({
  input,
  loggedInAs,
}: {
  input: CreateQuestionInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation CreateQuestion($input: CreateQuestionInput!) {
      createQuestion(input: $input) {
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
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const createQuestion = async ({
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
  parentId?: Question['parentId']
  actionExpectation?: CreateQuestionInput['actionExpectation']
  to?: User[]
  attachments?: Attachment[]
}): Promise<Question> => {
  const response = await mutateCreateQuestion({
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
    data: { createQuestion: question },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return question
}

export default createQuestion
