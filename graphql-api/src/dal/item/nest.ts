import type { PrismaClient } from '@prisma/client'

const nestItem = async ({
  prisma,
  itemId,
  newParentId,
  removeAnswerForQuestion,
}: {
  prisma: PrismaClient
  itemId: number
  newParentId: number | null
  removeAnswerForQuestion: number | null
}) => {
  await prisma.$transaction(
    [
      prisma.item.update({
        where: {
          id: itemId,
        },
        data: {
          parentId: newParentId,
        },
      }),
      removeAnswerForQuestion !== null
        ? prisma.question.update({
            where: { id: removeAnswerForQuestion },
            data: { answerId: null },
          })
        : null,
    ].filter(<T>(query: T | null): query is T => query !== null)
  )
}

export default nestItem
