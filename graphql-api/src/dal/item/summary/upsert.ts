import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { User } from 'src/types'
import { ITEM_INCLUDE } from '../constants'

const summarizeItem = async ({
  prisma,
  itemId,
  text,
  richText,
  shouldReplaceOriginalItem,
  currentUser,
}: {
  prisma: PrismaClient
  itemId: number
  text: string
  richText?: object | null | undefined
  shouldReplaceOriginalItem: boolean
  currentUser: User
}) => {
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      summary: {
        upsert: {
          create: {
            addedBy: {
              connect: { id: currentUser.id },
            },
            shouldReplaceOriginalItem,
            text,
            richText: richText ?? Prisma.DbNull,
          },
          update: {
            addedBy: {
              connect: { id: currentUser.id },
            },
            shouldReplaceOriginalItem,
            text,
            richText: richText ?? Prisma.DbNull,
          },
        },
      },
    },
    include: ITEM_INCLUDE,
  })

  return updatedItem
}

export default summarizeItem
