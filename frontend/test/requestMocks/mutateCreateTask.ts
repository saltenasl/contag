import { CreateTaskInput, User } from 'src/generated/graphql'
import taskFactory from 'test/factories/task'
import { getPublicUser } from 'test/factories/publicUser'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import { mockRequest } from 'test/utils/mockRequest'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { getFile } from 'test/factories/file'

const mockMutateCreateTask = ({ author }: { author: User }) => {
  const requestInfo = mockRequest('mutation', 'CreateTask', (variables) => {
    const {
      text,
      richText,
      to,
      shareWith,
      actionExpectation,
      parentId,
      attachments,
    } = variables.input as CreateTaskInput

    return {
      createTask: taskFactory.build({
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
        // so instead of an empty array, we should be returning `to` of the parent task.
        // However, there's no easy way to access it now (besides building a "task store")
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

export default mockMutateCreateTask
