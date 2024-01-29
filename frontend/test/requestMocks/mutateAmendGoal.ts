import { AmendGoalInput } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'
import { getPublicUser } from 'test/factories/publicUser'
import goalFactory from 'test/factories/goal'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAmendGoal = () => {
  const requestInfo = mockRequest('mutation', 'AmendGoal', (variables) => {
    const {
      goalStatus,
      text,
      richText,
      id,
      to,
      actionExpectation,
      attachments,
      sharedWith,
    } = variables.input as AmendGoalInput

    return {
      amendGoal: goalFactory.build({
        id,
        ...(to ? { to: to.map(({ id }) => getPublicUser(id)) } : {}),
        ...(text ? { text } : {}),
        ...(richText ? { richText } : {}),
        ...(goalStatus ? { goalStatus } : {}),
        ...(actionExpectation
          ? {
              actionExpectation: actionExpectationFactory.build({
                completeUntil: actionExpectation.completeUntil,
              }),
            }
          : {}),
        ...(sharedWith
          ? { sharedWith: sharedWith.map(({ id }) => getPublicUser(id)) }
          : {}),
        ...(attachments
          ? { attachments: attachments.map(({ id }) => getFile(id)) }
          : {}),
      }),
    }
  })

  return { requestInfo }
}

export default mockMutateAmendGoal
