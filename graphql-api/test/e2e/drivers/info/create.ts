import { faker } from '@faker-js/faker'
import type {
  Info,
  CreateInfoInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateCreateInfo = ({
  input,
  loggedInAs,
}: {
  input: CreateInfoInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation CreateInfo($input: CreateInfoInput!) {
      createInfo(input: $input) {
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
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const createInfo = async ({
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
  parentId?: Info['parentId']
  actionExpectation?: CreateInfoInput['actionExpectation']
  to?: User[]
  attachments?: Attachment[]
}): Promise<Info> => {
  const response = await mutateCreateInfo({
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
    data: { createInfo: info },
    errors,
  } = body

  expect(errors).not.toBeDefined()

  return info
}

export default createInfo
