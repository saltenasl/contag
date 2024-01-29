import { faker } from '@faker-js/faker'
import transformEntityFromPrismaToGraphQL from './entityFromPrismaToGraphQL'

describe('transformEntityFromPrismaToGraphQL', () => {
  it('generates string identifier', () => {
    const id = faker.datatype.number()
    const entityName = faker.random.alphaNumeric()

    expect(
      transformEntityFromPrismaToGraphQL({ id }, entityName)
    ).toStrictEqual({
      id: `${entityName}:${id}`,
    })
  })

  it('accepts object of any shape if it has id as string', () => {
    const id = faker.datatype.number()
    const entityName = faker.random.alphaNumeric()
    const someOtherKey = faker.datatype.number()

    expect(
      transformEntityFromPrismaToGraphQL({ id, someOtherKey }, entityName)
    ).toStrictEqual({ id: `${entityName}:${id}`, someOtherKey })
  })

  it('throws if entityName contains ":"', () => {
    const id = faker.datatype.number()

    expect(() =>
      transformEntityFromPrismaToGraphQL({ id }, 'entityName:')
    ).toThrow('entityName cannot contain ":"')
  })
})
