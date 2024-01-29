import {
  GetItemsQuery,
  CreateGoalMutation,
  SendMessageMutation,
  CreateTaskMutation,
  CreateQuestionMutation,
  CreateInfoMutation,
} from 'src/generated/graphql'
import { TypeName } from '@contag/graphql-api/src/constants'

export type Item = GetItemsQuery['items'][number]

export type Goal = NonNullable<CreateGoalMutation['createGoal']>
export type Message = NonNullable<SendMessageMutation['sendMessage']>
export type Task = NonNullable<CreateTaskMutation['createTask']>
export type Question = NonNullable<CreateQuestionMutation['createQuestion']>
export type Info = NonNullable<CreateInfoMutation['createInfo']>

export const isMessage = (item: Item): item is Message =>
  item.__typename === TypeName.MESSAGE

export const isTask = (item: Item): item is Task =>
  item.__typename === TypeName.TASK

export const isQuestion = (item: Item): item is Question =>
  item.__typename === TypeName.QUESTION

export const isInfo = (item: Item): item is Info =>
  item.__typename === TypeName.INFO

export const isGoal = (item: Item): item is Goal =>
  item.__typename === TypeName.GOAL
