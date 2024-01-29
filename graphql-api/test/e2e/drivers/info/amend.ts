import type {
  Info,
  AmendInfoInput,
  User,
  Attachment,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAmendInfo = ({
  input,
  loggedInAs,
}: {
  input: AmendInfoInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AmendInfo($input: AmendInfoInput!) {
      amendInfo(input: $input) {
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

const amendInfo = async ({
  loggedInAs,
  id,
  acknowledged,
  actionExpectation,
  to,
  sharedWith,
  attachments,
}: {
  loggedInAs: User
  id: string
  acknowledged?: boolean
  actionExpectation?: AmendInfoInput['actionExpectation']
  to?: User[]
  sharedWith?: User[]
  attachments?: Attachment[]
}): Promise<Info> => {
  const response = await mutateAmendInfo({
    input: {
      id,
      ...(acknowledged ? { acknowledged } : {}),
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
  expect(body.errors).not.toBeDefined()
  const {
    data: { amendInfo: info },
  } = body

  return info
}

export default amendInfo
