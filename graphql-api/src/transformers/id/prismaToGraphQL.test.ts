import { faker } from '@faker-js/faker'
import idFromPrismaToGraphQL from './prismaToGraphQL'

describe('idFromPrismaToGraphQL', () => {
  it('generates string identifier', () => {
    const id = faker.datatype.number()
    const entityName = faker.random.alphaNumeric()

    expect(idFromPrismaToGraphQL(id, entityName)).toStrictEqual(
      `${entityName}:${id}`
    )
  })

  it('throws if entityName contains ":"', () => {
    const id = faker.datatype.number()

    expect(() => idFromPrismaToGraphQL(id, 'entityName:')).toThrow(
      'entityName cannot contain ":"'
    )
  })
})
