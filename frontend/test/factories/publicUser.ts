import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { PublicUser } from 'src/generated/graphql'
import { getUserProfile } from './userProfile'
import { FactoryTypeFromGraphQLType } from './utils/types'
import userToPublicUser from './utils/userToPublicUser'

const basePublicUserFactory = Sync.makeFactory<
  FactoryTypeFromGraphQLType<PublicUser>
>({
  __typename: 'PublicUser',
  id: each((i) => `User:99999${i}`), // Starts with 99999 to not create duplicates with userProfileFactory
  email: each(() => faker.internet.email()),
  name: each(() => faker.name.fullName()),
  photoURL: each(() => faker.internet.url()),
  active: false,
})

const publicUsers: Partial<
  Record<string, FactoryTypeFromGraphQLType<PublicUser>>
> = {}

const wrapFactory = (
  factory: Factory<FactoryTypeFromGraphQLType<PublicUser>>
): {
  build: (typeof basePublicUserFactory)['build']
  buildList: (typeof basePublicUserFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const publicUserInCache = publicUsers[item.id]

      if (publicUserInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...publicUserInCache,
          ...item,
        })
        publicUsers[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const publicUser = factory.build(item)

    publicUsers[publicUser.id] = publicUser

    return publicUser
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const publicUserFactory = wrapFactory(basePublicUserFactory)

export const getPublicUser = (id: string) => {
  const publicUser = publicUsers[id]
  if (publicUser) {
    return publicUser
  }

  if (getUserProfile(id)) {
    return userToPublicUser(getUserProfile(id))
  }

  throw new Error(`public user with id "${id}" not found in public user store!`)
}

export default publicUserFactory
