import { mockRequest } from 'test/utils/mockRequest'

const mockMutateNestItem = () => {
  const requestInfo = mockRequest('mutation', 'NestItem', {
    nestItem: { success: true },
  })

  return { requestInfo }
}

export default mockMutateNestItem
