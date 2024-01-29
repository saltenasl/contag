import { SendMessageInput, User } from 'src/generated/graphql'
import { getFile } from 'test/factories/file'
import messageFactory from 'test/factories/message'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateSendMessage = ({ author }: { author: User }) => {
  const requestInfo = mockRequest('mutation', 'SendMessage', (variables) => {
    const { text, parentId, attachments } = variables.input as SendMessageInput

    return {
      sendMessage: messageFactory.build({
        author: userToPublicUser(author),
        text: text,
        parentId: parentId ?? null,
        sharedWith: [], // TODO: retrieve this from parent (and future proof by checking shareWith as well)
        attachments: attachments
          ? attachments.map(({ id }) => getFile(id))
          : [],
      }),
    }
  })

  return {
    requestInfo,
  }
}

export default mockMutateSendMessage
