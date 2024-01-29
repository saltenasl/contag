import { ItemType } from 'src/generated/graphql'
import messageFactory from 'test/factories/message'
import taskFactory from 'test/factories/task'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateConvertItem = () => {
  const requestInfo = mockRequest('mutation', 'ConvertItem', (variables) => ({
    convertItem:
      variables.input.to === ItemType.Message
        ? messageFactory.build({ id: variables.input.itemId })
        : taskFactory.build({ id: variables.input.itemId }),
  }))

  return { requestInfo }
}

export default mockMutateConvertItem
