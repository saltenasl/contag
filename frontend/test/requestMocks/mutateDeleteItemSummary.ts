import { DeleteItemSummaryMutationVariables } from 'src/generated/graphql'
import getItemFactory from 'test/factories/getItemFactory'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateDeleteItemSummary = () => {
  const requestInfo = mockRequest(
    'mutation',
    'DeleteItemSummary',
    (variables) => {
      const { itemId } = variables as DeleteItemSummaryMutationVariables

      return {
        deleteItemSummary: getItemFactory(itemId).build({
          id: itemId,
          summary: null,
        }),
      }
    }
  )

  return { requestInfo }
}

export default mockMutateDeleteItemSummary
