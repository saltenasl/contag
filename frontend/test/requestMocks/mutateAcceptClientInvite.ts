import usersClientFactory from 'test/factories/usersClient'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAcceptClientInvite = (
  usersClient = usersClientFactory.build()
) => {
  const requestInfo = mockRequest('mutation', 'AcceptClientInvite', {
    acceptClientInvite: { ...usersClient },
  })

  return { requestInfo, usersClient }
}

export default mockMutateAcceptClientInvite
