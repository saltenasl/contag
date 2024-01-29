import { faker } from '@faker-js/faker'
import type {
  Attachment,
  Message,
  SendMessageInput,
  User,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateSendMessage = ({
  input,
  loggedInAs,
}: {
  input: SendMessageInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation SendMessage($input: SendMessageInput!) {
      sendMessage(input: $input) {
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

const sendMessage = async ({
  author,
  shareWith,
  text = faker.lorem.sentence(),
  richText = JSON.parse(faker.datatype.json()),
  parentId = null,
  attachments = [],
}: {
  author: User
  shareWith?: User[]
  text?: string
  richText?: object
  parentId?: Message['parentId']
  attachments?: Attachment[]
}): Promise<Message> => {
  const response = await mutateSendMessage({
    input: {
      text,
      richText,
      parentId,
      ...(shareWith ? { shareWith: shareWith.map(({ id }) => ({ id })) } : {}),
      attachments,
    },
    loggedInAs: author,
  })

  expect(response.status).toBe(200)

  const {
    data: { sendMessage: message },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return message
}

export default sendMessage
