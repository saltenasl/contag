import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'
import buildUpdateAddressedToQuery from '../update/buildAddressedToQuery'
import buildUpdateSharedWithQuery from '../update/buildSharedWithQuery'
import updateActionExpectation from '../updateActionExpected'

const amendQuestionItem = async ({
  item,
  prisma,
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
  item: GenericItem
  prisma: PrismaClient
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
  const questionItem = await prisma.$transaction(async (prisma) => {
    await updateActionExpectation({ prisma, item, actionExpectation })

    return prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        question: {
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
  })

  return questionItem
}

export default amendQuestionItem
