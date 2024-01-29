import { CreateFileInput } from 'src/generated/graphql'
import fileFactory from 'test/factories/file'
import { mockRequest } from 'test/utils/mockRequest'

const mockMutateCreateFile = () => {
  const requestInfo = mockRequest('mutation', 'CreateFile', (variables) => {
    const { contentType, originalName, size } =
      variables.input as CreateFileInput

    return {
      createFile: fileFactory.build({
        contentType,
        originalName,
        size,
      }),
    }
  })

  return { requestInfo }
}

export default mockMutateCreateFile
