import type {
  Message,
  AmendMessageInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAmendMessage = ({
  input,
  loggedInAs,
}: {
  input: AmendMessageInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AmendMessage($input: AmendMessageInput!) {
      amendMessage(input: $input) {
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

const amendMessage = async ({
  loggedInAs,
  id,
  text,
  richText,
  sharedWith,
  attachments,
}: {
  loggedInAs: User
  id: string
  text?: string
  richText?: object
  sharedWith?: User[]
  attachments?: Attachment[]
}): Promise<Message> => {
  const response = await mutateAmendMessage({
    input: {
      id,
      ...(text !== undefined ? { text } : {}),
      ...(richText !== undefined ? { richText } : {}),
      ...(sharedWith
        ? { sharedWith: sharedWith.map(({ id }) => ({ id })) }
        : {}),
      ...(attachments ? { attachments } : {}),
    },
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { amendMessage: message },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return message
}

export default amendMessage
