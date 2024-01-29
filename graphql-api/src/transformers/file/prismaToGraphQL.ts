import { TypeName } from 'src/constants'
import type createFile from 'src/dal/file/create'
import type { File } from 'src/generated/graphql'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'

const fileFromPrismaToGraphQL = ({
  id,
  filename,
  extension,
  contentType,
  originalName,
  size,
}: Awaited<ReturnType<typeof createFile>>): File => ({
  __typename: TypeName.FILE,
  ...transformEntityFromPrismaToGraphQL(
    {
      id,
      filename: extension ? `${filename}.${extension}` : filename,
      contentType,
      originalName,
      size,
    },
    TypeName.FILE
  ),
})

export default fileFromPrismaToGraphQL
