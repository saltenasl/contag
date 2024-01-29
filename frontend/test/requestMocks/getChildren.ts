import { GetChildrenQueryVariables } from 'src/generated/graphql'
import { getAllGoalsWithParent } from 'test/factories/goal'
import { getAllInfosWithParent } from 'test/factories/info'
import { getAllMessagesWithParent } from 'test/factories/message'
import { getAllQuestionsWithParent } from 'test/factories/question'
import { getAllTasksWithParent } from 'test/factories/task'
import { mockRequest } from 'test/utils/mockRequest'

const mockGetChildren = () => {
  const requestInfo = mockRequest('query', 'GetChildren', (variables) => {
    const {
      filters: { parentId },
    } = variables as GetChildrenQueryVariables

    if (!parentId) {
      throw new Error(
        'GetChildren called without parent id! this is not supposed to ever happen'
      )
    }

    return {
      items: [
        ...getAllInfosWithParent(parentId),
        ...getAllMessagesWithParent(parentId),
        ...getAllQuestionsWithParent(parentId),
        ...getAllTasksWithParent(parentId),
        ...getAllGoalsWithParent(parentId),
      ],
    }
  })

  return {
    requestInfo,
  }
}

export default mockGetChildren
