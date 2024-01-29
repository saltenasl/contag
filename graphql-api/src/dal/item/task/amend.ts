import { Prisma } from '@prisma/client'
import type { TaskStatus, PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'
import buildUpdateAddressedToQuery from '../update/buildAddressedToQuery'
import buildUpdateSharedWithQuery from '../update/buildSharedWithQuery'
import updateActionExpectation from '../updateActionExpected'

const amendTask = async ({
  prisma,
  item,
  status,
  text,
  richText,
  actionExpectation,
  attachmentsAddedIds,
  attachmentsRemovedIds,
  addedToUserIds,
  addedSharedWithUserIds,
  removedSharedWithUserIds,
  removedToUserIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  status: TaskStatus | undefined | null
  text: string | undefined | null
  richText?: object | undefined | null
  actionExpectation: { completeUntil?: Date | null } | null | undefined
  attachmentsAddedIds: number[]
  attachmentsRemovedIds: number[]
  addedToUserIds: number[]
  addedSharedWithUserIds: number[]
  removedSharedWithUserIds: number[]
  removedToUserIds: number[]
}) => {
  const taskItem = await prisma.$transaction(async (prisma) => {
    await updateActionExpectation({ prisma, item, actionExpectation })

    const taskItem = await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        task: {
          update: {
            ...(text
              ? {
                  description: text,
                }
              : {}),
            ...(richText
              ? {
                  richText: richText ?? Prisma.DbNull,
                }
              : {}),
            ...(status ? { status } : {}),
          },
        },
        attachments: {
          connect: attachmentsAddedIds.map((id) => ({ id })),
          disconnect: attachmentsRemovedIds.map((id) => ({ id })),
        },
        addressedTo: buildUpdateAddressedToQuery({
          addedToUserIds,
          removedToUserIds,
        }),
        sharedWith: buildUpdateSharedWithQuery({
          addedSharedWithUserIds,
          removedSharedWithUserIds,
        }),
      },
      include: ITEM_INCLUDE,
    })

    return taskItem
  })

  return taskItem
}

export default amendTask
