import type { MutationResolvers } from 'src/generated/graphql'
import fileFromPrismaToGraphQL from 'src/transformers/file/prismaToGraphQL'
import createFileDalMethod from 'src/dal/file/create'
import allowUserAccessToFile from 'src/filesystem/allowUserAccessToFile'

const getExtension = (filename: string): string | null => {
  const parts = filename.split('.')

  if (parts.length < 2) {
    return null
  }

  return parts[parts.length - 1] ?? null
}

const createFile: Required<MutationResolvers>['createFile'] = async (
  _,
  args,
  context
) => {
  const extension = getExtension(args.input.originalName)

  const file = await createFileDalMethod({
    contentType: args.input.contentType,
    originalName: args.input.originalName,
    extension,
    size: args.input.size,
    prisma: context.prisma,
    currentUser: context.user,
  })

  await allowUserAccessToFile({
    operations: ['read', 'write'],
    filename: file.filename,
    userEmail: context.user.email,
  })

  return fileFromPrismaToGraphQL(file)
}

export default createFile
