import { faker } from '@faker-js/faker'
import parseGraphQLID from './parseGraphQLId'
import idFromPrismaToGraphQL from './prismaToGraphQL'

describe('parseGraphQLID', () => {
  it('decodes id', () => {
    const id = faker.datatype.number()

    expect(
      parseGraphQLID(idFromPrismaToGraphQL(id, faker.random.alphaNumeric())).id
    ).toBe(id)
  })

  it('decodes entity', () => {
    const entity = faker.random.alphaNumeric()

    expect(
      parseGraphQLID(idFromPrismaToGraphQL(faker.datatype.number(), entity))
        .entity
    ).toBe(entity)
  })

  it.each(['42', '42:42:42'])('throws when provided with %s', (id) => {
    expect(() => parseGraphQLID(id)).toThrow('Invalid ID')
  })
})
