import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { Task, TaskStatus } from 'src/generated/graphql'
import actionExpectationFactory from './actionExpectation'
import itemIdFactory from './item/id'
import publicUserFactory from './publicUser'

const baseTaskFactory = Sync.makeFactory<Task>(() => {
  const author = publicUserFactory.build()

  return {
    __typename: 'Task',
    parentId: null,
    id: each(() => itemIdFactory.build().id),
    author,
    text: each(() => faker.lorem.sentence()),
    richText: null,
    to: [],
    sharedWith: each(() => [author, publicUserFactory.build()]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: TaskStatus.Todo,
    childCount: 0,
    isAcceptedAnswer: null,
    actionExpectation: actionExpectationFactory.build(),
    summary: null,
    attachments: [],
    goals: [],
    blocks: [],
    blockedBy: [],
  }
})

const tasks: Partial<Record<string, Task>> = {}

const wrapFactory = (
  factory: Factory<Task>
): {
  build: (typeof baseTaskFactory)['build']
  buildList: (typeof baseTaskFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const taskInCache = tasks[item.id]

      if (taskInCache) {
        // update the cache entry
        const updatedUserProfile = factory.build({
          ...taskInCache,
          ...item,
        })
        tasks[item.id] = updatedUserProfile

        return updatedUserProfile
      }
    }

    const task = factory.build(item)

    tasks[task.id] = task

    return task
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const taskFactory = wrapFactory(baseTaskFactory)

export const getTask = (id: string) => {
  const task = tasks[id]
  if (task) {
    return task
  }

  throw new Error(`task with id "${id}" not found in task store!`)
}

export const getAllTasksWithParent = (parentId: string) =>
  Object.values(tasks).filter(
    (task): task is Task => !!task && task.parentId === parentId
  )

export default taskFactory
