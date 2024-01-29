const parseGraphQLId = (id: string) => {
  const splitted = id.split(':')

  if (splitted.length !== 2) {
    throw new Error('Invalid ID')
  }

  const [entity, parsedId] = splitted

  return {
    id: Number(parsedId),
    entity,
  }
}

export default parseGraphQLId
