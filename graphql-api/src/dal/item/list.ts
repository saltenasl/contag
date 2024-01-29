import type { PrismaClient, Prisma } from '@prisma/client'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import type { ItemsSort } from 'src/generated/graphql'
import { ITEM_INCLUDE } from './constants'
import toFullTextSearchTerm from '../utils/toFullTextSearchTerm'
import isItemId from './isItemId'
import parseGraphQLId from 'src/transformers/id/parseGraphQLId'
import isItemLink from './isItemLink'

const getOrderBy = (
  sort: ItemsSort
): Prisma.Enumerable<Prisma.ItemOrderByWithRelationAndSearchRelevanceInput> => {
  if (sort.type === ItemsSortType.CreatedAt) {
    return {
      createdAt: sort.order === ItemsSortOrder.OldestFirst ? 'asc' : 'desc',
    }
  }

  if (sort.type === ItemsSortType.CompleteUntil) {
    return [
      {
        actionExpectation: {
          completeUntil:
            sort.order === ItemsSortOrder.OldestFirst
              ? {
                  sort: 'desc',
                  nulls: 'first',
                }
              : {
                  sort: 'asc',
                  nulls: 'last',
                },
        },
      },
      { id: 'asc' },
    ]
  }

  return {}
}

const getFilteredItemIds = async ({
  search,
  prisma,
}: {
  search: string
  prisma: PrismaClient
}) => {
  if (isItemId(search)) {
    const { id } = parseGraphQLId(search)

    return [id]
  }

  if (isItemLink(search)) {
    const [_, graphqlId] = search.split('/item/')
    const { id } = parseGraphQLId(graphqlId as string) // isItemLink wouldn't pass if this wasn't a string

    return [id]
  }

  const searchTerm = toFullTextSearchTerm(search)

  const results = await prisma.$queryRaw<{ id: number }[]>`
    SELECT "Item".id
    FROM "Item"
    LEFT JOIN "Message" ON "Item"."messageId" = "Message"."id"
    LEFT JOIN "Task" ON "Item"."taskId" = "Task"."id"
    LEFT JOIN "Question" ON "Item"."questionId" = "Question"."id"
    LEFT JOIN "Info" ON "Item"."infoId" = "Info"."id"
    LEFT JOIN "Goal" ON "Item"."goalId" = "Goal"."id"
    LEFT JOIN "Summary" ON "Item"."id" = "Summary"."itemId"
    WHERE
      (
        "Message"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm}) OR
        "Task"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm}) OR
        "Question"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm}) OR
        "Info"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm}) OR
        "Goal"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm}) OR
        "Summary"."fullTextSearchColumn" @@ to_tsquery('english', ${searchTerm})
      )
    `

  return results.map(({ id }) => id)
}

const byNotNull = <T>(item: T | null): item is T => !!item

const listItems = async ({
  prisma,
  parentId,
  currentUserId,
  filterByUserId,
  sort,
  isQueryingOwnItems = false,
  itemType,
  actionExpectation,
  search,
  ids,
}: {
  prisma: PrismaClient
  parentId?: number | null | undefined
  currentUserId: number
  filterByUserId?: number | undefined
  sort: ItemsSort
  isQueryingOwnItems?: boolean
  itemType?:
    | {
        message?: boolean | null
        task?: boolean | null
        info?: boolean | null
        question?: boolean | null
        goal?: boolean | null
      }
    | null
    | undefined
  actionExpectation?: {
    todo?: boolean | null
    done?: boolean | null
    na?: boolean | null
  } | null
  search?: string | null | undefined
  ids?: number[]
}) => {
  const items = await prisma.item.findMany({
    where: {
      AND: [
        {
          sharedWith: {
            some: {
              userId: currentUserId,
            },
          },
        },
        filterByUserId
          ? {
              sharedWith: {
                some: {
                  userId: filterByUserId,
                },
              },
            }
          : null,
        isQueryingOwnItems
          ? { sharedWith: { every: { userId: currentUserId } } }
          : null,

        itemType
          ? {
              OR: [
                itemType.message === true ? { NOT: { messageId: null } } : null,
                itemType.question === true
                  ? { NOT: { questionId: null } }
                  : null,
                itemType.task === true ? { NOT: { taskId: null } } : null,
                itemType.info === true ? { NOT: { infoId: null } } : null,
                itemType.goal === true ? { NOT: { goalId: null } } : null,
              ].filter(byNotNull),
            }
          : null,

        actionExpectation
          ? {
              OR: [
                actionExpectation.done === true
                  ? {
                      actionExpectation: {
                        fulfilled: true,
                      },
                    }
                  : null,

                actionExpectation.todo === true
                  ? {
                      actionExpectation: {
                        fulfilled: false,
                      },
                    }
                  : null,

                actionExpectation.na === true
                  ? {
                      actionExpectation: null,
                    }
                  : null,
              ].filter(byNotNull),
            }
          : null,

        search
          ? {
              id: {
                in: await getFilteredItemIds({ search, prisma }),
              },
            }
          : null,

        parentId !== undefined ? { parentId } : null,

        ids ? { id: { in: ids } } : null,
      ].filter(byNotNull),
    },
    orderBy: getOrderBy(sort),
    include: ITEM_INCLUDE,
  })

  return items
}

export default listItems
