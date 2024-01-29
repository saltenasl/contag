import { faker } from '@faker-js/faker'
import { each, Sync } from 'factory.ts'
import { Summary } from 'src/generated/graphql'

const summaryFactory = Sync.makeFactory<Summary>({
  shouldReplaceOriginalItem: false,
  text: each(() => faker.lorem.sentence()),
  richText: null,
})

export default summaryFactory
