import { faker } from '@faker-js/faker'
import { Sync, each } from 'factory.ts'
import type { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'

export type LoggedInUser = {
  email: NonNullable<DecodedIdToken['email']>
  name?: DecodedIdToken['name']
  picture?: string
}

const loggedInUserFactory = Sync.makeFactory<LoggedInUser>({
  email: each((i) => `${i}${faker.internet.email()}`),
  name: each((i) => `${faker.name.fullName()} ${i}`),
  picture: each((i) => `${faker.internet.url()}/file${i}.jpg`),
})

export default loggedInUserFactory
