import { faker } from '@faker-js/faker'
import { each, Sync } from 'factory.ts'
import { UserClientRole, UsersClient } from 'src/generated/graphql'
import clientFactory from './client'
import publicUserFactory from './publicUser'

const usersClientFactory = Sync.makeFactory<UsersClient>({
  __typename: 'UsersClient',
  id: each(() => clientFactory.build().id), // id must be unique between all clients
  addedBy: each(() => publicUserFactory.build()),
  role: UserClientRole.Member,
  name: each(() => faker.company.name()),
})

export default usersClientFactory
