import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'
import buildUpdateAddressedToQuery from '../update/buildAddressedToQuery'
import buildUpdateSharedWithQuery from '../update/buildSharedWithQuery'
import updateActionExpectation from '../updateActionExpected'

const amendInfo = async ({
  prisma,
  item,
  acknowledged,
  text,
  richText,
  actionExpectation,
  attachmentsAddedIds,
  attachmentsRemovedIds,
  addedToUserIds,
  removedToUserIds,
  addedSharedWithUserIds,
  removedSharedWithUserIds,
}: {
  prisma: PrismaClient
  item: GenericItem
  acknowledged: boolean | undefined | null
  text: string | undefined | null
  richText?: object | undefined | null
  actionExpectation: { completeUntil?: Date | null } | null | undefined
  attachmentsAddedIds: number[]
  attachmentsRemovedIds: number[]
  addedToUserIds: number[]
  removedToUserIds: number[]
  addedSharedWithUserIds: number[]
  removedSharedWithUserIds: number[]
}) => {
  const infoItem = await prisma.$transaction(async (prisma) => {
    await updateActionExpectation({ prisma, item, actionExpectation })

    const infoItem = await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        info: {
          update: {
            ...(text ? { text } : {}),
            ...(richText
              ? {
                  richText: richText ?? Prisma.DbNull,
                }
              : {}),
            ...(typeof acknowledged === 'boolean' ? { acknowledged } : {}),
          },
        },
        attachments: {
          connect: attachmentsAddedIds.map((id) => ({ id })),
          disconnect: attachmentsRemovedIds.map((id) => ({ id })),
        },
        sharedWith: buildUpdateSharedWithQuery({
          addedSharedWithUserIds: [
            ...new Set([
              ...(addedSharedWithUserIds ?? []),
              ...(addedToUserIds ?? []),
            ]),
          ],
          removedSharedWithUserIds,
        }),
        addressedTo: buildUpdateAddressedToQuery({
          addedToUserIds,
          removedToUserIds,
        }),
      },
      include: ITEM_INCLUDE,
    })

    return infoItem
  })

  return infoItem
}

export default amendInfo
