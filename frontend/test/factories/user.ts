import { faker } from '@faker-js/faker'
import { Sync } from 'factory.ts'
import { User } from 'src/auth'

const userFactory = Sync.makeFactory<User>(() => {
  const user = {
    email: `${faker.internet.email()}`,
    emailVerified: true,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    isAnonymous: false,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => faker.random.alphaNumeric(12),
    getIdTokenResult: async () => ({} as ReturnType<User['getIdTokenResult']>),
    reload: async () => {},
    displayName: faker.name.fullName(),
    phoneNumber: faker.phone.number(),
    photoURL: faker.internet.url(),
    providerId: faker.random.alphaNumeric(6),
    uid: faker.random.alphaNumeric(6),
  }

  return {
    ...user,
    toJSON: () => user,
  }
})

export default userFactory
