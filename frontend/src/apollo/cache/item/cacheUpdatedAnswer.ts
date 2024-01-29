import { ApolloCache } from '@apollo/client'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import { GET_ITEMS } from 'src/queries/getItems'
import { isQuestion, Item } from 'src/types'

const cacheUpdatedAnswer = (
  cache: ApolloCache<unknown>,
  {
    answer,
    parentFeedVariables,
  }: {
    answer: Item
    parentFeedVariables: GetItemsQueryVariables | null
  }
) => {
  if (parentFeedVariables) {
    const parentFeedData = cache.readQuery({
      query: GET_ITEMS,
      variables: parentFeedVariables,
    })

    if (parentFeedData?.items) {
      const question = parentFeedData.items.find(
        ({ id }) => id === answer.parentId
      )

      if (question) {
        cache.writeQuery({
          query: GET_ITEMS,
          variables: parentFeedVariables,
          data: {
            items: parentFeedData.items.map((parentFeedItem) => {
              if (
                parentFeedItem.id === answer.parentId &&
                isQuestion(parentFeedItem)
              ) {
                return {
                  ...parentFeedItem,
                  acceptedAnswer: {
                    text: answer.text,
                    richText: answer.richText,
                  },
                  actionExpectation: {
                    ...parentFeedItem.actionExpectation,
                    fulfilled: true,
                  },
                }
              }

              return parentFeedItem
            }),
          },
        })
      } else {
        console.warn(
          "cacheUpdateAnswerToQuestion - Question not found in it's feed!"
        )
      }
    }
  }
}

export default cacheUpdatedAnswer
