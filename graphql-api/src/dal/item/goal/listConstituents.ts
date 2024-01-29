import type { PrismaClient } from '@prisma/client'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'
import type { User } from 'src/types'
import listItems from '../list'

const listConstituents = async ({
  prisma,
  itemId,
  currentUser,
}: {
  prisma: PrismaClient
  itemId: number
  currentUser: User
}) => {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      goal: {
        include: {
          constituents: true,
        },
      },
    },
  })

  const constituentIds = item?.goal?.constituents.map(({ id }) => id) || []

  const items = await listItems({
    prisma,
    currentUserId: currentUser.id,
    ids: constituentIds,
    sort: {
      order: ItemsSortOrder.OldestFirst,
      type: ItemsSortType.CreatedAt,
    },
  })

  return items.map((item) =>
    prismaItemToGraphQL(item, { hasQuestionParent: false, currentUser })
  )
}

export default listConstituents
