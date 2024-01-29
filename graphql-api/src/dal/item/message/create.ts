import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { ITEM_INCLUDE } from '../constants'

const createMessageItem = async ({
  prisma,
  currentUserId,
  parentId,
  text,
  richText,
  addressedToUserIds,
  shareWithUserIds,
  attachmentIds,
}: {
  prisma: PrismaClient
  currentUserId: number
  parentId?: number | null
  text: string
  richText?: object | null | undefined
  addressedToUserIds: number[]
  shareWithUserIds: number[]
  attachmentIds: number[]
}) => {
  const messageItem = await prisma.item.create({
    data: {
      author: {
        connect: {
          id: currentUserId,
        },
      },
      parent: parentId
        ? {
            connect: {
              id: parentId,
            },
          }
        : {},
      message: {
        create: {
          text,
          richText: richText ?? Prisma.DbNull,
        },
      },
      addressedTo: {
        create: [
          ...addressedToUserIds.map((id) => ({
            user: {
              connect: { id },
            },
          })),
        ],
      },
      sharedWith: {
        create: [
          ...shareWithUserIds.map((id) => ({
            user: {
              connect: { id },
            },
          })),
        ],
      },
      attachments: { connect: attachmentIds.map((id) => ({ id })) },
    },
    include: ITEM_INCLUDE,
  })

  return messageItem
}

export default createMessageItem
