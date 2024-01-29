import { mockRequest } from 'test/utils/mockRequest'
import { PublicUser } from 'src/generated/graphql'

const mockGetPublicUsers = (publicUsers: PublicUser[] = []) => {
  const requestInfo = mockRequest('query', 'GetPublicUsers', { publicUsers })

  return {
    requestInfo,
  }
}

export default mockGetPublicUsers
