import { CreateQuestionInput, User } from 'src/generated/graphql'
import questionFactory from 'test/factories/question'
import { getPublicUser } from 'test/factories/publicUser'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import { mockRequest } from 'test/utils/mockRequest'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'

const mockMutateCreateQuestion = ({ author }: { author: User }) => {
  const requestInfo = mockRequest('mutation', 'CreateQuestion', (variables) => {
    const { text, to, shareWith, actionExpectation, parentId, attachments } =
      variables.input as CreateQuestionInput

    return {
      createQuestion: questionFactory.build({
        author: userToPublicUser(author),
        text: text,
        to: to ? [...to.map(({ id }) => getPublicUser(id))] : [],
        sharedWith: shareWith
          ? [
              userToPublicUser(author),
              ...shareWith.map(({ id }) => getPublicUser(id)),
            ]
          : [], // TODO: `to` can be undefined; when it is - we must have a parentId here
        // so instead of an empty array, we should be returning `to` of the parent question.
        // However, there's no easy way to access it now (besides building a "question store")
        // so I am leaving this as an empty array for now.
        actionExpectation: actionExpectationFactory.build({
          completeUntil: actionExpectation.completeUntil,
        }),
        parentId: parentId ?? null,
        attachments: attachments
          ? attachments.map(({ id }) => getFile(id))
          : [],
      }),
    }
  })

  return {
    requestInfo,
  }
}

export default mockMutateCreateQuestion
