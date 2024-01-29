import type { QueryResolvers } from 'src/generated/graphql'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'
import validateItem from '../mutations/items/validators/item'

const queryItem: Required<QueryResolvers>['item'] = async (
  _,
  args,
  context
) => {
  const item = await validateItem({
    prisma: context.prisma,
    id: args.id,
    currentUser: context.user,
  })

  return prismaItemToGraphQL(item, {
    currentUser: context.user,
    hasQuestionParent: false,
  })
}

export default queryItem
