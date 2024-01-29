import { faker } from '@faker-js/faker'
import type { CreateFileInput, User, File } from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateCreateFile = ({
  input,
  loggedInAs,
}: {
  input: CreateFileInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation CreateFile($input: CreateFileInput!) {
      createFile(input: $input) {
        id
        filename
        originalName
        contentType
        size
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const createFile = async ({
  originalName = faker.lorem.word(),
  contentType = 'image/jpeg',
  size = faker.datatype.number(),
  loggedInAs,
}: {
  originalName?: string
  contentType?: string
  size?: number
  loggedInAs: User
}): Promise<File> => {
  const response = await mutateCreateFile({
    input: {
      originalName,
      contentType,
      size,
    },
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { createFile: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default createFile
