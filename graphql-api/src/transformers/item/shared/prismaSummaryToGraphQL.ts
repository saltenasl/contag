import type { Maybe, Summary } from 'src/generated/graphql'
import type { GenericItem } from 'src/types'

const prismaSummaryToGraphQL = (item: GenericItem): Maybe<Summary> =>
  item.summary
    ? {
        text: item.summary.text,
        richText: item.summary.richText,
        shouldReplaceOriginalItem: item.summary.shouldReplaceOriginalItem,
      }
    : null

export default prismaSummaryToGraphQL
