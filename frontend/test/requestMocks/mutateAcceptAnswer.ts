import { AcceptAnswerMutationVariables } from 'src/generated/graphql'
import getItemFactory from 'test/factories/getItemFactory'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAcceptAnswer = () => {
  const requestInfo = mockRequest('mutation', 'AcceptAnswer', (variables) => {
    const { itemId } = variables as AcceptAnswerMutationVariables

    return {
      acceptAnswer: getItemFactory(itemId).build({
        id: itemId,
        isAcceptedAnswer: true,
      }),
    }
  })

  return { requestInfo }
}

export default mockMutateAcceptAnswer
