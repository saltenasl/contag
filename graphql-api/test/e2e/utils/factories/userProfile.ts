import { faker } from '@faker-js/faker'
import { Sync, each } from 'factory.ts'
import type { CreateUserProfileInput } from 'src/generated/graphql'

export interface UserProfile extends Omit<CreateUserProfileInput, 'photoURL'> {
  photoURL?: string
}

const userProfileFactory = Sync.makeFactory<UserProfile>({
  name: each((i) => `${faker.name.fullName()} ${i}`),
  photoURL: each((i) => `${faker.internet.url()}/file${i}.jpg`),
})

export default userProfileFactory
