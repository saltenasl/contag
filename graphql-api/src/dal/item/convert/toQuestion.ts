import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { GenericItem } from 'src/types'
import { ITEM_INCLUDE } from '../constants'

// todo - refactor - no transaction is necessary here as deletes can be part of the update query
const convertToQuestion = async ({
  item,
  prisma,
}: {
  prisma: PrismaClient
  item: GenericItem
}) => {
  if (item.question) {
    return item
  }

  if (item.message) {
    const [_, updatedItem] = await prisma.$transaction([
      prisma.message.delete({ where: { id: item.message.id } }),
      prisma.item.update({
        where: {
          id: item.id,
        },
        data: {
          question: {
            create: {
              text: item.message.text,
              richText: item.message.richText ?? Prisma.DbNull,
            },
          },
          actionExpectation: {
            create: {},
          },
        },
        include: ITEM_INCLUDE,
      }),
    ])

    return updatedItem
  }

  if (item.task) {
    const [_, updatedItem] = await prisma.$transaction([
      prisma.task.delete({ where: { id: item.task.id } }),
      prisma.item.update({
        where: {
          id: item.id,
        },
        data: {
          question: {
            create: {
              text: item.task.description,
              richText: item.task.richText ?? Prisma.DbNull,
            },
          },
        },
        include: ITEM_INCLUDE,
      }),
    ])

    return updatedItem
  }

  if (item.info) {
    const [_, updatedItem] = await prisma.$transaction([
      prisma.info.delete({ where: { id: item.info.id } }),
      prisma.item.update({
        where: {
          id: item.id,
        },
        data: {
          question: {
            create: {
              text: item.info.text,
              richText: item.info.richText ?? Prisma.DbNull,
            },
          },
        },
        include: ITEM_INCLUDE,
      }),
    ])

    return updatedItem
  }

  if (item.goal) {
    const [_, updatedItem] = await prisma.$transaction([
      prisma.goal.delete({ where: { id: item.goal.id } }),
      prisma.item.update({
        where: {
          id: item.id,
        },
        data: {
          question: {
            create: {
              text: item.goal.title,
              richText: item.goal.richText ?? Prisma.DbNull,
            },
          },
        },
        include: ITEM_INCLUDE,
      }),
    ])

    return updatedItem
  }

  throw new Error(`Unknown type to convert from, converting item ${item.id}`)
}

export default convertToQuestion
