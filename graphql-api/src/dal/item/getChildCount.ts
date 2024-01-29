import type { PrismaClient } from '@prisma/client'

const getItemChildCount = async ({
  prisma,
  id,
}: {
  prisma: PrismaClient
  id: number
}) => {
  const result = await prisma.$queryRaw`
    WITH RECURSIVE child_items AS (
      SELECT id, "parentId"
      FROM public."Item" WHERE id=${id}
        UNION
          SELECT items.id, items."parentId"
          FROM public."Item" items
          INNER JOIN child_items ON child_items.id=items."parentId"
    ) SELECT COUNT(id) as "childItemsCount" FROM child_items;`

  // @ts-expect-error this query always returns a single result with "childItemsCount" prop
  const [{ childItemsCount }] = result

  return Number(childItemsCount) - 1 // this count includes "self" item hence we need to subtract it
}

export default getItemChildCount
