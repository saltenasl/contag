import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import getItem from 'src/dal/item/get'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { User } from 'src/types'

async function validateItem({
  prisma,
  id,
  itemType,
  currentUser,
}: {
  prisma: PrismaClient
  id: string
  itemType?: 'message' | 'task' | 'question' | 'info' | 'goal'
  currentUser: User
}) {
  const item = await getItem({
    id: idFromGraphQLToPrisma(id),
    prisma,
  })

  if (
    !item ||
    (itemType && !item[itemType]) ||
    !item.sharedWith.some((recipient) => recipient.userId === currentUser.id)
  ) {
    throw new GraphQLError('Item not found')
  }

  return item
}

export default validateItem
