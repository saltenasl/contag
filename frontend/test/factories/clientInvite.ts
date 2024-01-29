import { faker } from '@faker-js/faker'
import { each, Sync } from 'factory.ts'
import { InviteToClient } from 'src/generated/graphql'
import clientFactory from './client'
import publicUserFactory from './publicUser'
import { FactoryTypeFromGraphQLType } from './utils/types'

const clientInviteFactory = Sync.makeFactory<
  FactoryTypeFromGraphQLType<InviteToClient>
>({
  __typename: 'InviteToClient',
  id: each((i) => `InviteToClient:${i}`),
  client: each(() => clientFactory.build()),
  email: each(() => faker.internet.email()),
  invitedBy: each(() => publicUserFactory.build()),
})

export default clientInviteFactory
