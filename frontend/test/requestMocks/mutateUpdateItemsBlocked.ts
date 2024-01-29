import { MutationUpdateItemsBlockedArgs } from 'src/generated/graphql'
import getItem from 'test/factories/utils/getItem'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateUpdateItemsBlocked = () => {
  const requestInfo = mockRequest(
    'mutation',
    'UpdateItemsBlocked',
    (variables) => {
      const { itemsBlockedAdded, itemsBlockedRemoved, itemId } =
        variables as MutationUpdateItemsBlockedArgs

      const item = getItem(itemId)
      const blocksBeforeUpdate = item.blocks ?? []

      return {
        updateItemsBlocked: {
          ...item,
          blocks: [
            ...blocksBeforeUpdate.filter(
              (item) => !itemsBlockedRemoved.some(({ id }) => id === item.id)
            ),
            ...itemsBlockedAdded.map(({ id }) => getItem(id)),
          ],
        },
      }
    }
  )

  return { requestInfo }
}

export default mockMutateUpdateItemsBlocked
