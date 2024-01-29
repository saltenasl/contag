import type { PrismaClient } from '@prisma/client'
import type { GenericItem, User, UserWithoutIncludes } from 'src/types'
import validateUserIdsShareClientWithCurrentUser from 'src/dal/user/validateUserIdsShareClientWithCurrentUser'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { ObjectReference } from 'src/generated/graphql'
import validateItem from './item'
import { GraphQLError } from 'graphql'

const validateTo = async ({
  to,
  item,
  currentUser,
  prisma,
}: {
  to: ObjectReference[] | undefined | null
  item: GenericItem
  currentUser: User
  prisma: PrismaClient
}): Promise<{
  addedToUsers: UserWithoutIncludes[]
  removedToUsers: UserWithoutIncludes[]
}> => {
  if (to) {
    const toIds = to.map(({ id }) => idFromGraphQLToPrisma(id))
    const toIdsExcludingCurrentIdsInDB = toIds.filter(
      (id) => !item.addressedTo.some(({ userId }) => userId === id)
    )

    const addedToUsers = await validateUserIdsShareClientWithCurrentUser({
      currentUser,
      prisma,
      ids: toIdsExcludingCurrentIdsInDB,
    })

    return {
      addedToUsers,
      removedToUsers: item.addressedTo
        .filter(({ userId }) => !toIds.includes(userId))
        .map(({ user }) => user),
    }
  }

  return { addedToUsers: [], removedToUsers: [] }
}

const validateSharedWith = async ({
  sharedWith,
  item,
  currentUser,
  prisma,
  addedToUserIds,
}: {
  sharedWith: ObjectReference[] | undefined | null
  item: GenericItem
  currentUser: User
  prisma: PrismaClient
  addedToUserIds: number[]
}): Promise<{
  addedSharedWithUsers: UserWithoutIncludes[]
  removedSharedWithUsers: UserWithoutIncludes[]
}> => {
  if (sharedWith || addedToUserIds.length > 0) {
    const nonUniqueSharedWithIds = [
      ...(sharedWith
        ? sharedWith.map(({ id }) => idFromGraphQLToPrisma(id))
        : item.sharedWith.map((recipient) => recipient.user.id)),
      ...addedToUserIds,
    ]
    const sharedWithIds = [...new Set(nonUniqueSharedWithIds)]

    const sharedWithIdsExcludingCurrentIdsInDB = sharedWithIds.filter(
      (id) => !item.sharedWith.some(({ userId }) => userId === id)
    )

    const addedSharedWithUsers =
      await validateUserIdsShareClientWithCurrentUser({
        currentUser,
        prisma,
        ids: sharedWithIdsExcludingCurrentIdsInDB,
      })

    const removedSharedWithUsers = item.sharedWith
      .filter(({ userId }) => !sharedWithIds.some((id) => id === userId))
      .map(({ user }) => user)

    if (removedSharedWithUsers.find((user) => currentUser.id === user.id)) {
      throw new GraphQLError('Cannot remove yourself from sharedWith')
    }

    return { addedSharedWithUsers, removedSharedWithUsers }
  }

  return { addedSharedWithUsers: [], removedSharedWithUsers: [] }
}

const validateAmendItem = async ({
  prisma,
  id,
  currentUser,
  to,
  sharedWith,
  itemType,
}: {
  prisma: PrismaClient
  id: string
  currentUser: User
  to: ObjectReference[] | undefined | null
  sharedWith: ObjectReference[] | undefined | null
  itemType: 'message' | 'task' | 'question' | 'info' | 'goal'
}) => {
  const item = await validateItem({ prisma, itemType, id, currentUser })

  const { addedToUsers, removedToUsers } = await validateTo({
    to,
    item,
    currentUser,
    prisma,
  })
  const { addedSharedWithUsers, removedSharedWithUsers } =
    await validateSharedWith({
      sharedWith,
      item,
      currentUser,
      prisma,
      addedToUserIds: addedToUsers.map(({ id }) => id),
    })

  return {
    item,
    addedToUsers,
    removedToUsers,
    addedSharedWithUsers,
    removedSharedWithUsers,
  }
}

export default validateAmendItem
