import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'
import buildUpdateSharedWithQuery from '../update/buildSharedWithQuery'

const amendMessageItem = async ({
  item,
  prisma,
  text,
  richText,
  attachmentsAddedIds,
  attachmentsRemovedIds,
  addedSharedWithUserIds,
  removedSharedWithUserIds,
}: {
  item: GenericItem
  prisma: PrismaClient
  text: string | undefined | null
  richText?: object | undefined | null
  attachmentsAddedIds: number[]
  attachmentsRemovedIds: number[]
  addedSharedWithUserIds: number[]
  removedSharedWithUserIds: number[]
}) => {
  const messageItem = await prisma.item.update({
    where: {
      id: item.id,
    },
    data: {
      message: {
        update: {
          ...(text ? { text } : {}),
          ...(richText
            ? {
                richText: richText ?? Prisma.DbNull,
              }
            : {}),
        },
      },
      attachments: {
        connect: attachmentsAddedIds.map((id) => ({ id })),
        disconnect: attachmentsRemovedIds.map((id) => ({ id })),
      },
      sharedWith: buildUpdateSharedWithQuery({
        addedSharedWithUserIds,
        removedSharedWithUserIds,
      }),
    },
    include: ITEM_INCLUDE,
  })

  return messageItem
}

export default amendMessageItem
