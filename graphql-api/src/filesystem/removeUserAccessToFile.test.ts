import type removeUserAccessToFileType from './removeUserAccessToFile'
import * as firebase from 'firebase-admin'
import { faker } from '@faker-js/faker'

const removeUserAccessToFile = jest.requireActual('./removeUserAccessToFile')
  .default as typeof removeUserAccessToFileType

describe('removeUserAccessToFile', () => {
  const doc = jest.fn()
  const get = jest.fn()
  const deleteFn = jest.fn()

  beforeEach(() => {
    jest
      .spyOn(firebase, 'firestore')
      .mockReturnValue({ doc } as unknown as ReturnType<
        typeof firebase.firestore
      >)

    doc.mockReturnValue({ get, delete: deleteFn })
    get.mockReturnValue({
      exists: true,
    })
  })

  it('deletes read access for user in firestore', async () => {
    const filename = faker.datatype.uuid()
    const userEmail = faker.internet.email()

    await removeUserAccessToFile({ filename, userEmail })

    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/read/${userEmail}`
    )
    expect(get).toHaveBeenCalled()
    expect(deleteFn).toHaveBeenCalled()
  })

  it('doesnt deletes read access for user in firestore if it doesnt exist', async () => {
    const filename = faker.datatype.uuid()
    const userEmail = faker.internet.email()

    get.mockReturnValue({
      exists: false,
    })

    await removeUserAccessToFile({ filename, userEmail })

    expect(doc).toHaveBeenCalledWith(
      `/attachments/${filename}/read/${userEmail}`
    )
    expect(get).toHaveBeenCalled()
    expect(deleteFn).not.toHaveBeenCalled()
  })
})
