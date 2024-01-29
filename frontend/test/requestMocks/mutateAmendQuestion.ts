import { AmendQuestionInput } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'
import { getPublicUser } from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAmendQuestion = () => {
  const requestInfo = mockRequest('mutation', 'AmendQuestion', (variables) => {
    const { id, to, text, actionExpectation, attachments, sharedWith } =
      variables.input as AmendQuestionInput

    return {
      amendQuestion: questionFactory.build({
        id,
        ...(to ? { to: to.map(({ id }) => getPublicUser(id)) } : {}),
        ...(text ? { text: text } : {}),
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

  return {
    requestInfo,
  }
}

export default mockMutateAmendQuestion
