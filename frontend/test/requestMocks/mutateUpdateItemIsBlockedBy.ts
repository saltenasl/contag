import { MutationUpdateItemIsBlockedByArgs } from 'src/generated/graphql'
import getItem from 'test/factories/utils/getItem'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateUpdateItemIsBlockedBy = () => {
  const requestInfo = mockRequest(
    'mutation',
    'UpdateItemIsBlockedBy',
    (variables) => {
      const { blockedByAdded, blockedByRemoved, itemId } =
        variables as MutationUpdateItemIsBlockedByArgs

      const item = getItem(itemId)
      const blocksBeforeUpdate = item.blocks ?? []

      return {
        updateItemIsBlockedBy: {
          ...item,
          blocks: [
            ...blocksBeforeUpdate.filter(
              (item) => !blockedByRemoved.some(({ id }) => id === item.id)
            ),
            ...blockedByAdded.map(({ id }) => getItem(id)),
          ],
        },
      }
    }
  )

  return { requestInfo }
}

export default mockMutateUpdateItemIsBlockedBy
