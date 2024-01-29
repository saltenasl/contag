import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import { ItemType } from 'src/generated/graphql'
import createGoal from '../goal/create'
import createInfo from '../info/create'
import sendMessage from '../message/send'
import createQuestion from '../question/create'
import createTask from '../task/create'

const createItem = async (type: ItemType, { author }: { author: User }) => {
  switch (type) {
    case ItemType.Task:
      return await createTask({
        author,
        shareWith: [author],
        actionExpectation: {},
      })

    case ItemType.Message:
      return await sendMessage({ author, shareWith: [author] })

    case ItemType.Question:
      return await createQuestion({
        author,
        shareWith: [author],
        actionExpectation: {},
      })

    case ItemType.Info:
      return await createInfo({
        author,
        shareWith: [author],
        actionExpectation: {},
      })

    case ItemType.Goal:
      return await createGoal({
        author,
        shareWith: [author],
        actionExpectation: {},
      })

    default:
      throw new Error(`Unknown item type "${type}"`)
  }
}

export const getItemTypeName = (type: ItemType) => {
  switch (type) {
    case ItemType.Message:
      return TypeName.MESSAGE
    case ItemType.Question:
      return TypeName.QUESTION
    case ItemType.Task:
      return TypeName.TASK
    case ItemType.Info:
      return TypeName.INFO
    case ItemType.Goal:
      return TypeName.GOAL
    default:
      throw new Error(`Unknown item type "${type}"`)
  }
}

export default createItem
