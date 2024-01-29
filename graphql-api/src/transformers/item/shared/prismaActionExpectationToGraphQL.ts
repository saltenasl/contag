import type { ActionExpectation } from 'src/generated/graphql'
import { ActionExpectationType } from 'src/generated/graphql'
import type { GenericItem, User } from 'src/types'

const prismaActionExpectationToGraphQL = ({
  item,
  currentUser,
}: {
  item: GenericItem
  currentUser: User
}): ActionExpectation => {
  if (!item.actionExpectation) {
    // This should never happen as action expectation is mandatory on all item types except for a message.
    // This may have happened on legacy items, however they're fixed with a migration to always have an action expectation.
    // If you see this warning it means there's an issue and somehow non-message item type was created with an action expectation, this needs to be investigated then.
    console.warn(`Item "${item.id}" has no action expectation!`)

    return {
      completeUntil: null,
      type: ActionExpectationType.ActionExpected,
      fulfilled: true,
    }
  }

  return {
    type:
      item.addressedTo.some(({ userId }) => currentUser.id === userId) ||
      item.addressedTo.length === 0
        ? ActionExpectationType.ActionExpectedFromYou
        : ActionExpectationType.ActionExpected,
    completeUntil: item.actionExpectation.completeUntil,
    fulfilled: item.actionExpectation.fulfilled,
  }
}

export default prismaActionExpectationToGraphQL
