import { MutationUpdateGoalConstituentsArgs } from 'src/generated/graphql'
import { getGoal } from 'test/factories/goal'
import { mockRequest } from 'test/utils/mockRequest'
import getItem from 'test/factories/utils/getItem'

const mockMutateUpdateGoalConstituents = () => {
  const requestInfo = mockRequest(
    'mutation',
    'UpdateGoalConstituents',
    (variables) => {
      const { constituentsAdded, constituentsRemoved, itemId } =
        variables as MutationUpdateGoalConstituentsArgs

      const goal = getGoal(itemId)
      const constituentsBeforeUpdate = goal.constituents ?? []

      return {
        updateGoalConstituents: {
          ...goal,
          constituents: [
            ...constituentsBeforeUpdate.filter(
              (constituent) =>
                !constituentsRemoved.some(({ id }) => id === constituent.id)
            ),
            ...constituentsAdded.map(({ id }) => getItem(id)),
          ],
        },
      }
    }
  )

  return { requestInfo }
}

export default mockMutateUpdateGoalConstituents
