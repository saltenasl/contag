import { AmendInfoInput } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'
import infoFactory from 'test/factories/info'
import { getPublicUser } from 'test/factories/publicUser'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateAmendInfo = () => {
  const requestInfo = mockRequest('mutation', 'AmendInfo', (variables) => {
    const { id, to, text, actionExpectation, attachments, sharedWith } =
      variables.input as AmendInfoInput

    return {
      amendInfo: infoFactory.build({
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

export default mockMutateAmendInfo
