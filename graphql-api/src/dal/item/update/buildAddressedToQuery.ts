import type { Prisma } from '@prisma/client'

const buildUpdateAddressedToQuery = ({
  addedToUserIds,
  removedToUserIds,
}: {
  addedToUserIds: number[]
  removedToUserIds: number[]
}): Prisma.RecipientUpdateManyWithoutAddressedToItemNestedInput => ({
  ...(addedToUserIds.length > 0
    ? { create: addedToUserIds.map((userId) => ({ userId })) }
    : {}),
  ...(removedToUserIds.length > 0
    ? {
        deleteMany: removedToUserIds.map((userId) => ({
          userId,
        })),
      }
    : {}),
})

export default buildUpdateAddressedToQuery
