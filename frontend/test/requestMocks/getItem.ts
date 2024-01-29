import { GetItemQueryVariables } from 'src/generated/graphql'
import getItem from 'test/factories/utils/getItem'
import { mockRequest } from 'test/utils/mockRequest'

const mockGetItem = () => {
  const requestInfo = mockRequest('query', 'GetItem', (variables) => {
    const { id } = variables as GetItemQueryVariables

    return {
      item: getItem(id),
    }
  })

  return {
    requestInfo,
  }
}

export default mockGetItem
