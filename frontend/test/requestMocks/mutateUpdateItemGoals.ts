import { MutationUpdateItemGoalsArgs } from 'src/generated/graphql'
import { getGoal } from 'test/factories/goal'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateUpdateItemGoals = () => {
  const requestInfo = mockRequest(
    'mutation',
    'UpdateItemGoals',
    (variables) => {
      const { goalsAdded, goalsRemoved, itemId } =
        variables as MutationUpdateItemGoalsArgs

      const goal = getGoal(itemId)
      const goalsBeforeUpdate = goal.goals ?? []

      return {
        updateItemGoals: {
          ...goal,
          goals: [
            ...goalsBeforeUpdate.filter(
              (goal) => !goalsRemoved.some(({ id }) => id === goal.id)
            ),
            ...goalsAdded.map(({ id }) => getGoal(id)),
          ],
        },
      }
    }
  )

  return { requestInfo }
}

export default mockMutateUpdateItemGoals
