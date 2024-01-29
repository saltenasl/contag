import type { GenericItem, User } from 'src/types'
import prismaGoalItemToGraphQL from './prismaGoalToGraphQL'
import prismaInfoItemToGraphQL from './prismaInfoToGraphQL'
import prismaMessageItemToGraphQL from './prismaMessageToGraphQL'
import prismaQuestionItemToGraphQL from './prismaQuestionToGraphQL'
import prismaTaskItemToGraphQL from './prismaTaskToGraphQL'

const prismaItemToGraphQL = (
  item: GenericItem,
  {
    hasQuestionParent,
    currentUser,
  }: { hasQuestionParent: boolean; currentUser: User }
) => {
  if (item.message) {
    return prismaMessageItemToGraphQL(
      { ...item, message: item.message },
      { hasQuestionParent, currentUser }
    )
  }

  if (item.task) {
    return prismaTaskItemToGraphQL(
      { ...item, task: item.task },
      { hasQuestionParent, currentUser }
    )
  }

  if (item.question) {
    return prismaQuestionItemToGraphQL(
      { ...item, question: item.question },
      { hasQuestionParent, currentUser }
    )
  }

  if (item.info) {
    return prismaInfoItemToGraphQL(
      { ...item, info: item.info },
      { hasQuestionParent, currentUser }
    )
  }

  if (item.goal) {
    return prismaGoalItemToGraphQL(
      { ...item, goal: item.goal },
      { hasQuestionParent, currentUser }
    )
  }

  throw new Error('Item has no known type, this should never happen!')
}

export default prismaItemToGraphQL
