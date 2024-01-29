import { SearchItemsQuery } from 'src/generated/graphql'

export const getItemTextSummary = (
  child: SearchItemsQuery['items'][number]
): { text: string; richText?: object | null } => {
  if (child.summary && child.summary.shouldReplaceOriginalItem) {
    return {
      text: child.summary.text,
      richText: child.summary.richText,
    }
  }

  return { text: child.text, richText: null }
}
