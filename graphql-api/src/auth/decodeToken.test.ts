import { faker } from '@faker-js/faker'
import decodeToken from './decodeToken'
import firebase from 'firebase-admin'
import type { Auth } from 'firebase-admin/lib/auth/auth'

jest.mock('firebase-admin')

const mockVerifyIdToken = () => {
  const verifyIdToken = jest.fn()

  firebase.auth = jest.fn(() => ({ verifyIdToken } as unknown as Auth))

  return verifyIdToken
}

describe('decodeToken', () => {
  it('throws an error when the token is not in correct format', async () => {
    await expect(decodeToken(faker.random.word())).rejects.toThrow(
      'Unauthorized'
    )
  })

  it('throws if firebase throws', async () => {
    mockVerifyIdToken().mockRejectedValue(new Error('test!'))

    await expect(decodeToken(`Bearer ${faker.random.word()}`)).rejects.toThrow(
      'Unauthorized'
    )
  })

  it.each(['email', 'email_verified'])(
    'throws if %s is undefined',
    async (undefinedKey) => {
      mockVerifyIdToken().mockResolvedValue({
        email: faker.internet.email(),
        email_verified: true,
        [undefinedKey]: undefined,
      })

      await expect(
        decodeToken(`Bearer ${faker.random.word()}`)
      ).rejects.toThrow('Unauthorized')
    }
  )

  it('decodes the token', async () => {
    const email = faker.internet.email()
    const name = faker.name.fullName()
    const picture = faker.internet.url()

    mockVerifyIdToken().mockResolvedValue({
      email,
      email_verified: true,
      name,
      picture,
    })

    await expect(
      decodeToken(`Bearer ${faker.random.word()}`)
    ).resolves.toStrictEqual({ email, name, picture })
  })
})
