import type { Prisma } from '@prisma/client'

const buildUpdateSharedWithQuery = ({
  addedSharedWithUserIds,
  removedSharedWithUserIds,
}: {
  addedSharedWithUserIds: number[]
  removedSharedWithUserIds: number[]
}): Prisma.RecipientUpdateManyWithoutSharedWithItemNestedInput => ({
  ...(addedSharedWithUserIds.length > 0
    ? { create: addedSharedWithUserIds.map((userId) => ({ userId })) }
    : {}),
  ...(removedSharedWithUserIds.length > 0
    ? {
        deleteMany: removedSharedWithUserIds.map((userId) => ({
          userId,
        })),
      }
    : {}),
})

export default buildUpdateSharedWithQuery
