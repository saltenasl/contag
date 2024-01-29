import { faker } from '@faker-js/faker'
import actionExpectationFactory from 'test/factories/actionExpectation'
import messageFactory from 'test/factories/message'
import questionFactory from 'test/factories/question'
import userProfileFactory from 'test/factories/userProfile'
import mockMutateNestItem from 'test/requestMocks/mutateNestItem'
import { DragDirection, drop, move, pickUp } from 'test/utils/dragAndDrop'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'

describe('nesting items', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true })
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('nests message under another message', async () => {
    const { requestInfo } = mockMutateNestItem()

    const {
      waitFor,
      parentItem,
      parentFeedItems,
      personsFeed,
      nestedFeed,
      within,
    } = await renderAndNavigateToNestedFeed()

    const toBeNestedMessage = parentFeedItems.find(
      ({ id }) => parentItem.id !== id
    )

    if (toBeNestedMessage === undefined) {
      throw new Error('"toBeNestedMessage" must be defined')
    }

    const toBeNestedDragHandle = within(
      within(personsFeed).getByTestId(`item-${toBeNestedMessage.id}`)
    ).getByLabelText('drag handle')
    expect(toBeNestedDragHandle).toBeInTheDocument()

    await pickUp(toBeNestedDragHandle)
    await move(toBeNestedDragHandle, DragDirection.UP)
    await drop(toBeNestedDragHandle)

    await waitFor(() => {
      expect(requestInfo.calledTimes).toBe(1)
    })

    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        itemId: toBeNestedMessage.id,
        newParentId: parentItem.id,
      },
    })

    await waitFor(() => {
      expect(
        within(personsFeed).queryByTestId(`item-${toBeNestedMessage.id}`)
      ).not.toBeInTheDocument()
    })
    expect(
      within(nestedFeed).getByTestId(`item-${toBeNestedMessage.id}`)
    ).toBeInTheDocument()
  })

  describe('question related logic', () => {
    it('when accepted answer is nested under non-question item - it is updated to no longer be an answer or potential answer', async () => {
      mockMutateNestItem()
      const myProfile = userProfileFactory.build()
      const answerText = faker.lorem.sentence()
      const answer = questionFactory.build({
        text: answerText,
        isAcceptedAnswer: true,
      })
      const anotherItem = messageFactory.build()

      const { personsFeed, nestedFeed, within, waitFor } =
        await renderAndNavigateToNestedFeed({
          myProfile,
          parentFeedItems: [anotherItem, answer],
          nestedItems: [],
        })

      expect(
        within(
          within(personsFeed).getByTestId(`item-${answer.id}`)
        ).getByLabelText('this is the accepted answer')
      ).toBeInTheDocument()

      const answerDragHandle = within(
        within(personsFeed).getByTestId(`item-${answer.id}`)
      ).getByLabelText('drag handle')

      await pickUp(answerDragHandle)
      await move(answerDragHandle, DragDirection.UP)
      await drop(answerDragHandle)

      const nestedItemCard = await waitFor(() => {
        const nestedItemCard = within(nestedFeed).getByTestId(
          `item-${answer.id}`
        )
        expect(nestedItemCard).toBeInTheDocument()

        return nestedItemCard
      })

      expect(
        within(nestedItemCard).queryByLabelText('this is the accepted answer')
      ).not.toBeInTheDocument()
      expect(
        within(nestedItemCard).queryByLabelText('accept as the answer')
      ).not.toBeInTheDocument()
    })

    it('when item is nested under another question - it is updated to a potential answer', async () => {
      mockMutateNestItem()
      const myProfile = userProfileFactory.build()
      const item = questionFactory.build()
      const anotherQuestion = questionFactory.build()

      const { personsFeed, nestedFeed, within, waitFor } =
        await renderAndNavigateToNestedFeed({
          myProfile,
          parentFeedItems: [anotherQuestion, item],
          nestedItems: [],
        })

      const answerDragHandle = within(
        within(personsFeed).getByTestId(`item-${item.id}`)
      ).getByLabelText('drag handle')

      await pickUp(answerDragHandle)
      await move(answerDragHandle, DragDirection.UP)
      await drop(answerDragHandle)

      const nestedItemCard = await waitFor(() => {
        const nestedItemCard = within(nestedFeed).getByTestId(`item-${item.id}`)
        expect(nestedItemCard).toBeInTheDocument()

        return nestedItemCard
      })

      expect(
        within(nestedItemCard).queryByLabelText('this is the accepted answer')
      ).not.toBeInTheDocument()
      expect(
        within(nestedItemCard).getByLabelText('accept as the answer')
      ).toBeInTheDocument()
    })

    it('when answer is nested under another item - removes answer text from question card & unfulfills action expected', async () => {
      mockMutateNestItem()
      const myProfile = userProfileFactory.build()
      const answerText = faker.lorem.sentence()
      const question = questionFactory.build({
        acceptedAnswer: {
          text: answerText,
          richText: null,
        },
        actionExpectation: actionExpectationFactory.build({ fulfilled: true }),
      })
      const item = messageFactory.build({
        text: answerText,
        isAcceptedAnswer: true,
      })
      const anotherItem = messageFactory.build()

      const { personsFeed, nestedFeed, within, waitFor } =
        await renderAndNavigateToNestedFeed({
          myProfile,
          parentFeedItems: [question],
          nestedItems: [anotherItem, item],
        })

      const questionCard = within(personsFeed).getByTestId(
        `item-${question.id}`
      )
      expect(
        within(questionCard).getByLabelText('accepted answer')
      ).toHaveTextContent(answerText)
      expect(
        within(questionCard).queryByText('Action expected')
      ).not.toBeInTheDocument()

      const answerDragHandle = within(
        within(nestedFeed).getByTestId(`item-${item.id}`)
      ).getByLabelText('drag handle')

      await pickUp(answerDragHandle)
      await move(answerDragHandle, DragDirection.UP)
      await drop(answerDragHandle)

      await waitFor(() => {
        expect(
          within(questionCard).queryByLabelText('accepted answer')
        ).not.toBeInTheDocument()
      })
      expect(
        within(questionCard).getByText('Action expected')
      ).toBeInTheDocument()
    })
  })
})
