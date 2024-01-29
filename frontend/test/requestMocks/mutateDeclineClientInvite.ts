import { mockRequest } from 'test/utils/mockRequest'

const mockMutateDeclineClientInvite = (success = true) => {
  const requestInfo = mockRequest('mutation', 'DeclineClientInvite', {
    declineClientInvite: { success },
  })

  return requestInfo
}

export default mockMutateDeclineClientInvite
