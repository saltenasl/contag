import { faker } from '@faker-js/faker'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'
import createFile, { mutateCreateFile } from './drivers/file/create'
import createUser from './drivers/user/create'

jest.mock('src/filesystem/allowUserAccessToFile')

describe('createFile mutation', () => {
  it('creates a file and calls allowUserAccessToFile', async () => {
    const loggedInAs = await createUser()

    const input = {
      contentType: 'image/jpeg',
      originalName: faker.lorem.word(),
      size: faker.datatype.number(),
    }

    const response = await mutateCreateFile({
      input,
      loggedInAs,
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toStrictEqual({
      data: {
        createFile: {
          id: expect.any(String),
          filename: expect.any(String),
          ...input,
        },
      },
    })

    expect(allowUserAccessToFile).toHaveBeenCalledWith({
      operations: ['read', 'write'],
      filename: body.data.createFile.filename,
      userEmail: loggedInAs.email,
    })
  })

  it('preserves original extension in the newly generated filename', async () => {
    const loggedInAs = await createUser()

    const extension = faker.random.alpha(2)

    const file = await createFile({
      originalName: `${faker.lorem.word()}.${extension}`,
      loggedInAs,
    })

    expect(file.filename.endsWith(`.${extension}`)).toBe(true)
  })
})
