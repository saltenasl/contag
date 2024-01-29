import clientInviteFactory from 'test/factories/clientInvite'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateInviteToClient = () => {
  const requestInfo = mockRequest('mutation', 'InviteToClient', {
    inviteToClient: clientInviteFactory.build(),
  })

  return requestInfo
}

export default mockMutateInviteToClient
