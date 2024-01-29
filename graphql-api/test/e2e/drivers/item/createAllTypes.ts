import type {
  Goal,
  Info,
  Message,
  Question,
  Task,
  User,
} from 'src/generated/graphql'
import { ItemType } from 'src/generated/graphql'
import createItem from './create'

const createAllItemTypes = async ({ author }: { author: User }) => {
  const [message, question, task, info, goal] = await Promise.all([
    createItem(ItemType.Message, { author }),
    createItem(ItemType.Question, { author }),
    createItem(ItemType.Task, { author }),
    createItem(ItemType.Info, { author }),
    createItem(ItemType.Goal, { author }),
  ])

  return {
    message: message as Message,
    question: question as Question,
    task: task as Task,
    info: info as Info,
    goal: goal as Goal,
  }
}

export default createAllItemTypes
