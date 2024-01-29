const idFromPrismaToGraphQL = (id: number, entityName: string) => {
  if (entityName.includes(':')) {
    throw new Error('entityName cannot contain ":"')
  }

  return `${entityName}:${id}`
}

export default idFromPrismaToGraphQL
