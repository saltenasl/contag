import { faker } from '@faker-js/faker'
import { each, Sync } from 'factory.ts'
import { Client } from 'src/generated/graphql'
import { FactoryTypeFromGraphQLType } from './utils/types'

const clientFactory = Sync.makeFactory<FactoryTypeFromGraphQLType<Client>>({
  __typename: 'Client',
  id: each((i) => `Client:${i}`),
  name: each(() => faker.company.name()),
})

export default clientFactory
