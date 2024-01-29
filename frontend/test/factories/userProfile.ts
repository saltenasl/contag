import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { User, UserClientRole } from 'src/generated/graphql'
import usersClientFactory from './usersClient'
import { FactoryTypeFromGraphQLType } from './utils/types'

const baseUserProfileFactory = Sync.makeFactory<
  FactoryTypeFromGraphQLType<User>
>({
  __typename: 'User',
  id: each((i) => `User:${i}`),
  email: each(() => faker.internet.email()),
  name: each(() => faker.name.fullName()),
  photoURL: each(() => faker.internet.url()),
  clients: each(() => [
    usersClientFactory.build({
      name: faker.company.name(),
      addedBy: null,
      role: UserClientRole.Owner,
    }),
  ]),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  clientInvites: [],
})

const userProfiles: Partial<Record<string, FactoryTypeFromGraphQLType<User>>> =
  {}

const wrapFactory = (
  factory: Factory<FactoryTypeFromGraphQLType<User>>
): {
  build: (typeof baseUserProfileFactory)['build']
  buildList: (typeof baseUserProfileFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const userProfileInCache = userProfiles[item.id]

      if (userProfileInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...userProfileInCache,
          ...item,
        })
        userProfiles[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const publicUser = factory.build(item)

    userProfiles[publicUser.id] = publicUser

    return publicUser
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const userProfileFactory = wrapFactory(baseUserProfileFactory)

export const getUserProfile = (id: string) => {
  const userProfile = userProfiles[id]
  if (userProfile) {
    return userProfile
  }

  throw new Error(
    `user profile with id "${id}" not found in user profile store!`
  )
}

export default userProfileFactory
