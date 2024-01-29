import { getGoal } from '../goal'
import { getInfo } from '../info'
import { getMessage } from '../message'
import { getQuestion } from '../question'
import { getTask } from '../task'

const getItem = (id: string) => {
  try {
    const message = getMessage(id)

    if (message) {
      return message
    }
  } catch {
    /* empty */
  }

  try {
    const task = getTask(id)

    if (task) {
      return task
    }
  } catch {
    /* empty */
  }

  try {
    const question = getQuestion(id)

    if (question) {
      return question
    }
  } catch {
    /* empty */
  }

  try {
    const info = getInfo(id)

    if (info) {
      return info
    }
  } catch {
    /* empty */
  }

  try {
    const goal = getGoal(id)

    if (goal) {
      return goal
    }
  } catch {
    /* empty */
  }

  throw new Error(`Item with id "${id}" not found!`)
}

export default getItem
