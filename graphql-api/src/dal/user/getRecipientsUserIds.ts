import type { PrismaClient } from '@prisma/client'
import type { ObjectReference } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { GenericItem, User } from 'src/types'
import validateUserIdsShareClientWithCurrentUser from './validateUserIdsShareClientWithCurrentUser'

const getShareWithIds = async ({
  parent,
  shareWith,
  prisma,
  currentUser,
}: {
  parent: GenericItem | null
  shareWith: ObjectReference[] | null | undefined
  prisma: PrismaClient
  currentUser: User
}) => {
  if (shareWith) {
    const ids = shareWith.map(({ id }) => idFromGraphQLToPrisma(id))

    await validateUserIdsShareClientWithCurrentUser({
      prisma,
      currentUser,
      ids,
    })

    return [currentUser.id, ...ids]
  }

  if (parent) {
    return parent.sharedWith.map(({ user }) => user.id)
  }

  return [currentUser.id]
}

const getRecipientsUserIds = async ({
  parent,
  shareWith,
  addressedTo,
  prisma,
  currentUser,
}: {
  parent: GenericItem | null
  shareWith: ObjectReference[] | null | undefined
  addressedTo: ObjectReference[] | null | undefined
  prisma: PrismaClient
  currentUser: User
}): Promise<{ shareWithUserIds: number[]; addressedToUserIds: number[] }> => {
  const shareWithUserIds = await getShareWithIds({
    parent,
    shareWith,
    prisma,
    currentUser,
  })

  const addressedToUserIds = addressedTo
    ? addressedTo.map(({ id }) => idFromGraphQLToPrisma(id))
    : []

  await validateUserIdsShareClientWithCurrentUser({
    prisma,
    currentUser,
    ids: addressedToUserIds,
  })

  const uniqueShareWithUserIds = [
    ...new Set([...shareWithUserIds, ...addressedToUserIds]),
  ]

  return { shareWithUserIds: uniqueShareWithUserIds, addressedToUserIds }
}

export default getRecipientsUserIds
