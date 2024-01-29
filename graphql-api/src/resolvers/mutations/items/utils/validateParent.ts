import type { PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { TypeName } from 'src/constants'
import getParentItem from 'src/dal/item/getParent'
import parseGraphQLId from 'src/transformers/id/parseGraphQLId'
import type { User } from 'src/types'

const validateItemParent = async ({
  parentId,
  prisma,
  currentUser,
}: {
  parentId: string | null | undefined
  prisma: PrismaClient
  currentUser: User
}) => {
  const parent = parentId ? parseGraphQLId(parentId) : null

  if (!parent) {
    return { parent: null }
  }

  if (parent.entity !== TypeName.ITEM) {
    throw new GraphQLError(`Invalid parentId entity type "${parent.entity}"`)
  }

  const parentItem = await getParentItem({
    prisma,
    parentId: parent.id,
    currentUser,
  })

  if (!parentItem) {
    throw new GraphQLError('Parent not found')
  }

  return { parent: parentItem }
}

export default validateItemParent
