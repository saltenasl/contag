import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { ITEM_INCLUDE } from '../constants'

const createGoalItem = async ({
  prisma,
  currentUserId,
  parentId,
  text,
  richText,
  addressedToUserIds,
  shareWithUserIds,
  actionExpectation,
  attachmentIds,
}: {
  prisma: PrismaClient
  parentId: number | null
  currentUserId: number
  text: string
  richText?: object | null | undefined
  addressedToUserIds: number[]
  shareWithUserIds: number[]
  actionExpectation: { completeUntil?: Date | null } | null | undefined
  attachmentIds: number[]
}) => {
  const goalItem = prisma.item.create({
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
      goal: {
        create: {
          title: text,
          richText: richText ?? Prisma.DbNull,
        },
      },
      addressedTo: {
        create: [
          ...addressedToUserIds.map((id) => ({
            user: {
              connect: {
                id,
              },
            },
          })),
        ],
      },
      sharedWith: {
        create: [
          ...shareWithUserIds.map((id) => ({
            user: {
              connect: {
                id,
              },
            },
          })),
        ],
      },
      actionExpectation: actionExpectation
        ? {
            create: {
              completeUntil: actionExpectation.completeUntil || null,
            },
          }
        : {},
      attachments: { connect: attachmentIds.map((id) => ({ id })) },
    },
    include: ITEM_INCLUDE,
  })

  return goalItem
}

export default createGoalItem
