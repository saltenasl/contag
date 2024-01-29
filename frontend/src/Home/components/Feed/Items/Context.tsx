import { createContext, useContext } from 'react'
import { GetItemsQueryVariables } from 'src/generated/graphql'

const ItemsFeedContext = createContext<
  | {
      variables: GetItemsQueryVariables
      parentFeedVariables: GetItemsQueryVariables | null
      childFeedVariables: GetItemsQueryVariables | null
    }
  | undefined
>(undefined)

export const useItemsFeedContext = () => {
  const context = useContext(ItemsFeedContext)

  return context
}

export default ItemsFeedContext
