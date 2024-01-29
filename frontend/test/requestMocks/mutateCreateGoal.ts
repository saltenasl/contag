import { CreateGoalInput, User } from 'src/generated/graphql'
import goalFactory from 'test/factories/goal'
import { getPublicUser } from 'test/factories/publicUser'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import { mockRequest } from 'test/utils/mockRequest'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'

const mockMutateCreateGoal = ({ author }: { author: User }) => {
  const requestInfo = mockRequest('mutation', 'CreateGoal', (variables) => {
    const {
      text,
      richText,
      to,
      shareWith,
      actionExpectation,
      parentId,
      attachments,
    } = variables.input as CreateGoalInput

    return {
      createGoal: goalFactory.build({
        author: userToPublicUser(author),
        text,
        richText,
        to: to ? [...to.map(({ id }) => getPublicUser(id))] : [],
        sharedWith: shareWith
          ? [
              userToPublicUser(author),
              ...shareWith.map(({ id }) => getPublicUser(id)),
            ]
          : [], // TODO: `to` can be undefined; when it is - we must have a parentId here
        // so instead of an empty array, we should be returning `to` of the parent goal.
        // However, there's no easy way to access it now (besides building a "goal store")
        // so I am leaving this as an empty array for now.
        parentId: parentId ?? null,
        actionExpectation: actionExpectationFactory.build({
          completeUntil: actionExpectation.completeUntil,
        }),
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

export default mockMutateCreateGoal
