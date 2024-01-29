import type { PrismaClient } from '@prisma/client'
import type { GenericItem, Item } from 'src/types'
import getItem from '../get'

const acceptAnswerForQuestion = async ({
  questionItem,
  answerItem,
  prisma,
}: {
  questionItem: Item<'question'>
  answerItem: GenericItem
  prisma: PrismaClient
}) => {
  await prisma.question.update({
    where: {
      id: questionItem.question.id,
    },
    data: {
      answerId: answerItem.id,
    },
  })

  const updatedAnswer = await getItem({ prisma, id: answerItem.id })

  if (!updatedAnswer) {
    // this should never be reached as answer item must always exist
    throw new Error('Cannot find updated answer')
  }

  return updatedAnswer
}

export default acceptAnswerForQuestion
