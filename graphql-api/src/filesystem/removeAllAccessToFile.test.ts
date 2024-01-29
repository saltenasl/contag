import type removeAllAccessToFileType from './removeAllAccessToFile'
import * as firebase from 'firebase-admin'
import { faker } from '@faker-js/faker'

const removeAllAccessToFile = jest.requireActual('./removeAllAccessToFile')
  .default as typeof removeAllAccessToFileType

describe('removeAllAccessToFile', () => {
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

  it('deletes attachment entry in firestore', async () => {
    const filename = faker.datatype.uuid()

    await removeAllAccessToFile({ filename })

    expect(doc).toHaveBeenCalledWith(`/attachments/${filename}`)
    expect(get).toHaveBeenCalled()
    expect(deleteFn).toHaveBeenCalled()
  })

  it('doesnt delete attachment entry in firestore if it doesnt exist', async () => {
    const filename = faker.datatype.uuid()

    get.mockReturnValue({
      exists: false,
    })

    await removeAllAccessToFile({ filename })

    expect(doc).toHaveBeenCalledWith(`/attachments/${filename}`)
    expect(get).toHaveBeenCalled()
    expect(deleteFn).not.toHaveBeenCalled()
  })
})
