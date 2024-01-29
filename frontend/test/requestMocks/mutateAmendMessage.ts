import { AmendMessageInput } from 'src/generated/graphql'
import { getFile } from 'test/factories/file'
import messageFactory from 'test/factories/message'
import { getPublicUser } from 'test/factories/publicUser'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAmendMessage = ({ hangForever = false } = {}) => {
  const requestInfo = mockRequest(
    'mutation',
    'AmendMessage',
    (variables) => {
      const { id, text, attachments, sharedWith } =
        variables.input as AmendMessageInput

      return {
        amendMessage: messageFactory.build({
          id,
          ...(text ? { text: text } : {}),
          ...(attachments
            ? { attachments: attachments.map(({ id }) => getFile(id)) }
            : {}),
          ...(sharedWith
            ? { sharedWith: sharedWith.map(({ id }) => getPublicUser(id)) }
            : {}),
        }),
      }
    },
    { hangForever }
  )

  return {
    requestInfo,
  }
}

export default mockMutateAmendMessage
