import { AmendTaskInput } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'
import { getPublicUser } from 'test/factories/publicUser'
import taskFactory from 'test/factories/task'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAmendTask = () => {
  const requestInfo = mockRequest('mutation', 'AmendTask', (variables) => {
    const {
      status,
      text,
      richText,
      id,
      to,
      actionExpectation,
      attachments,
      sharedWith,
    } = variables.input as AmendTaskInput

    return {
      amendTask: taskFactory.build({
        id,
        ...(to ? { to: to.map(({ id }) => getPublicUser(id)) } : {}),
        ...(text ? { text } : {}),
        ...(richText ? { richText } : {}),
        ...(status ? { status } : {}),
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

export default mockMutateAmendTask
