import idFromPrismaToGraphQL from './id/prismaToGraphQL'

const transformEntityFromPrismaToGraphQL = <
  T extends { [key: string]: unknown; id: number }
>(
  { id, ...rest }: T,
  entityName: string
): Omit<T, 'id'> & { id: string } => ({
  id: idFromPrismaToGraphQL(id, entityName),
  ...rest,
})

export default transformEntityFromPrismaToGraphQL
