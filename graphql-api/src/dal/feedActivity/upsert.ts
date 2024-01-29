import type { PrismaClient } from '@prisma/client'
import { TypeName } from 'src/constants'
import parseGraphQLId from 'src/transformers/id/parseGraphQLId'

const upsertFeedActivity = async ({
  prisma,
  currentUserId,
  parent,
}: {
  prisma: PrismaClient
  currentUserId: number
  parent: string | undefined | null
}) => {
  if (!parent) {
    return
  }

  const { entity: parentEntity, id: parentId } = parseGraphQLId(parent)

  const data = {
    userId: currentUserId,
    parentItemId: parentEntity === TypeName.ITEM ? parentId : null,
    parentUserId: parentEntity === TypeName.USER ? parentId : null,
  }

  const activity = await prisma.feedActivity.findFirst({
    where: data,
  })

  if (activity) {
    await prisma.feedActivity.update({
      data: { fieldToForceUpdate: Math.floor(Math.random() * 100) },
      where: { id: activity.id },
    })
  } else {
    await prisma.feedActivity.create({ data })
  }

  return {
    success: true,
  }
}

export default upsertFeedActivity
