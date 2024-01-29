import type allowUserAccessToFileType from './allowUserAccessToFile'
import * as firebase from 'firebase-admin'
import { faker } from '@faker-js/faker'

const allowUserAccessToFile = jest.requireActual('./allowUserAccessToFile')
  .default as typeof allowUserAccessToFileType

describe('allowUserAccessToFile', () => {
  const doc = jest.fn()
  const get = jest.fn()
  const create = jest.fn()

  beforeEach(() => {
    jest
      .spyOn(firebase, 'firestore')
      .mockReturnValue({ doc } as unknown as ReturnType<
        typeof firebase.firestore
      >)

    doc.mockReturnValue({ get, create })
    get.mockReturnValue({
      exists: false,
    })
  })

  it('creates entry in firestore for read operation', async () => {
    const userEmail = faker.internet.email()
    const filename = faker.datatype.uuid()

    await allowUserAccessToFile({
      operations: ['read'],
      userEmail,
      filename,
    })

    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/read/${userEmail}`
    )
    expect(create).toHaveBeenCalledWith({})
  })

  it('creates entries in firestore for read and write operations', async () => {
    const userEmail = faker.internet.email()
    const filename = faker.datatype.uuid()

    await allowUserAccessToFile({
      operations: ['read', 'write'],
      userEmail,
      filename,
    })

    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/read/${userEmail}`
    )
    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/write/${userEmail}`
    )
    expect(create).toHaveBeenNthCalledWith(1, {})
    expect(create).toHaveBeenNthCalledWith(2, {})
  })

  it("doesn't call create when entry in firestore already exists", async () => {
    const userEmail = faker.internet.email()
    const filename = faker.datatype.uuid()

    get.mockReturnValue({
      exists: true,
    })

    await allowUserAccessToFile({
      operations: ['read', 'write'],
      userEmail,
      filename,
    })

    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/read/${userEmail}`
    )
    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/write/${userEmail}`
    )

    expect(create).not.toHaveBeenCalled()
  })

  describe('errors', () => {
    it('fails when empty operations array is provided', async () => {
      await expect(
        allowUserAccessToFile({
          operations: [],
          userEmail: faker.internet.email(),
          filename: faker.datatype.uuid(),
        })
      ).rejects.toThrow('0 or more than 2 operations provided')
    })

    it('fails when more than 2 operations provided', async () => {
      await expect(
        allowUserAccessToFile({
          operations: ['read', 'write', 'write'],
          userEmail: faker.internet.email(),
          filename: faker.datatype.uuid(),
        })
      ).rejects.toThrow('0 or more than 2 operations provided')
    })
  })
})
