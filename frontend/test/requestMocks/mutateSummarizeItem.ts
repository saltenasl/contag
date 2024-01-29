import { Item } from 'src/generated/graphql'
import summaryFactory from 'test/factories/summary'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateSummarizeItem = (itemsToBeSummarized: Item[]) => {
  const requestInfo = mockRequest('mutation', 'SummarizeItem', (variables) => {
    const item = itemsToBeSummarized.find(({ id }) => variables.itemId === id)

    if (!item) {
      throw new Error(
        'Item that is being converted not found in itemsToBeSummarized'
      )
    }

    return {
      summarizeItem: {
        ...item,
        summary: summaryFactory.build({
          text: variables.text,
          shouldReplaceOriginalItem: variables.shouldReplaceOriginalItem,
        }),
      },
    }
  })

  return { requestInfo }
}

export default mockMutateSummarizeItem
