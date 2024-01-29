import type { PrismaClient } from '@prisma/client'
import type { YogaInitialContext } from 'graphql-yoga'
import type upsertUser from './dal/user/upsert'
import type listItems from 'src/dal/item/list'
import type getUser from './dal/user/get'

export type User = Awaited<ReturnType<typeof upsertUser>>

export type UserWithoutIncludes = NonNullable<
  Awaited<ReturnType<typeof getUser>>
>

export interface Context extends YogaInitialContext {
  prisma: PrismaClient
  user: User
}

export type GenericItem = Awaited<ReturnType<typeof listItems>>[number]

export type Item<Prop extends keyof GenericItem> = Omit<GenericItem, Prop> &
  Record<Prop, NonNullable<GenericItem[Prop]>>
