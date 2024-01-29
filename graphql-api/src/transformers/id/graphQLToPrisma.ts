import parseGraphQLId from './parseGraphQLId'

const idFromGraphQLToPrisma = (id: string): number => {
  const parsedId = parseGraphQLId(id)

  return parsedId.id
}

export default idFromGraphQLToPrisma
