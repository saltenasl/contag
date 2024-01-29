import { Sync } from 'factory.ts'
import { ActionExpectation, ActionExpectationType } from 'src/generated/graphql'

const actionExpectationFactory = Sync.makeFactory<ActionExpectation>({
  type: ActionExpectationType.ActionExpected,
  completeUntil: null,
  fulfilled: false,
})

export default actionExpectationFactory
