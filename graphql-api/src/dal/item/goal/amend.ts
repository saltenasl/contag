import { Prisma } from '@prisma/client'
import type { GoalStatus, PrismaClient } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'
import buildUpdateAddressedToQuery from '../update/buildAddressedToQuery'
import buildUpdateSharedWithQuery from '../update/buildSharedWithQuery'
import updateActionExpectation from '../updateActionExpected'

const amendGoal = async ({
  prisma,
  item,
  goalStatus,
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
  goalStatus: GoalStatus | undefined | null
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
  const goalItem = await prisma.$transaction(async (prisma) => {
    await updateActionExpectation({ prisma, item, actionExpectation })

    const goalItem = await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        goal: {
          update: {
            ...(text
              ? {
                  title: text,
                }
              : {}),
            ...(richText
              ? {
                  richText: richText ?? Prisma.DbNull,
                }
              : {}),
            ...(goalStatus ? { status: goalStatus } : {}),
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

    return goalItem
  })

  return goalItem
}

export default amendGoal
