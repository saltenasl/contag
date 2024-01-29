import type { PrismaClient } from '@prisma/client'
import type { User } from 'src/types'

const createFile = async ({
  originalName,
  contentType,
  extension,
  size,
  prisma,
  currentUser,
}: {
  originalName: string
  contentType: string
  extension: string | null
  size: number
  prisma: PrismaClient
  currentUser: User
}) => {
  const file = await prisma.file.create({
    data: {
      contentType,
      originalName,
      extension: extension ?? null,
      size,
      createdById: currentUser.id,
    },
  })

  return file
}

export default createFile
