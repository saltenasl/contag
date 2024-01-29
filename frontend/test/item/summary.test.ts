import summaryFactory from 'test/factories/summary'
import questionFactory from 'test/factories/question'
import mockMutateSummarizeItem from 'test/requestMocks/mutateSummarizeItem'
import mockMutateDeleteItemSummary from 'test/requestMocks/mutateDeleteItemSummary'
import messageFactory from 'test/factories/message'
import taskFactory from 'test/factories/task'
import { faker } from '@faker-js/faker'
import infoFactory from 'test/factories/info'
import renderItemPage from './utils/renderItemPage'
import { Item } from 'src/generated/graphql'
import goalFactory from 'test/factories/goal'

describe('summaries', () => {
  describe('when shouldReplaceOriginalItem=false', () => {
    const message = messageFactory.build({
      summary: summaryFactory.build(),
    })
    const question = questionFactory.build({
      summary: summaryFactory.build(),
    })
    const task = taskFactory.build({
      summary: summaryFactory.build(),
    })
    const info = infoFactory.build({
      summary: summaryFactory.build(),
    })
    const goal = goalFactory.build({
      summary: summaryFactory.build(),
    })

    it.each`
      item        | itemType
      ${message}  | ${'message'}
      ${question} | ${'question'}
      ${task}     | ${'task'}
      ${info}     | ${'info'}
      ${goal}     | ${'goal'}
    `(
      'shows summary along with item text for $itemType',
      async ({ item }: { item: Item }) => {
        const { screen, within } = await renderItemPage({
          id: item.id,
        })

        const itemCard = screen.getByTestId(`item-${item.id}`)

        expect(within(itemCard).getByText(item.text)).toBeInTheDocument()

        expect(
          within(itemCard).getByText(`TLDR: ${item.summary?.text}`)
        ).toBeInTheDocument()
      }
    )
  })

  describe('when shouldReplaceOriginalItem=true', () => {
    const message = messageFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const question = questionFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const task = taskFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const info = infoFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const goal = goalFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })

    it.each`
      item        | itemType
      ${message}  | ${'message'}
      ${question} | ${'question'}
      ${task}     | ${'task'}
      ${info}     | ${'info'}
      ${goal}     | ${'goal'}
    `(
      'summary replaces item text for $itemType',
      async ({ item }: { item: Item }) => {
        const { screen, within } = await renderItemPage({
          id: item.id,
        })

        const itemCard = screen.getByTestId(`item-${item.id}`)

        expect(within(itemCard).queryByText(item.text)).not.toBeInTheDocument()

        expect(
          within(itemCard).getByText(`TLDR: ${item.summary?.text}`)
        ).toBeInTheDocument()
      }
    )
  })

  it('summarizes message', async () => {
    const message = messageFactory.build({
      summary: null,
    })

    const { screen, within, userEvent, waitFor } = await renderItemPage({
      id: message.id,
    })

    const messageCard = screen.getByTestId(`item-${message.id}`)
    const summarizeItem = within(messageCard).getByLabelText('summarize item')
    expect(summarizeItem).toBeInTheDocument()

    expect(
      within(messageCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()

    await userEvent.click(summarizeItem)

    const summaryInput = within(messageCard).getByLabelText('Type summary here')
    expect(summaryInput).toBeInTheDocument()
    expect(summaryInput).toHaveFocus()

    const shouldReplaceTextSwitch =
      within(messageCard).getByLabelText('Override item text')
    expect(shouldReplaceTextSwitch).toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeChecked()
    await userEvent.click(shouldReplaceTextSwitch)
    expect(shouldReplaceTextSwitch).toBeChecked()

    const submitSummary = within(messageCard).getByLabelText('submit summary')
    expect(submitSummary).toBeInTheDocument()
    expect(submitSummary).toBeDisabled()

    expect(
      within(messageCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(messageCard).getByLabelText('delete summary')
    ).toBeInTheDocument()
    expect(within(messageCard).getByLabelText('delete summary')).toBeDisabled()

    const summary = faker.lorem.word()

    await userEvent.type(summaryInput, summary)

    expect(within(messageCard).getByLabelText('delete summary')).toBeDisabled()

    const { requestInfo } = mockMutateSummarizeItem([message])

    await userEvent.click(submitSummary)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemId: message.id,
      text: summary,
      shouldReplaceOriginalItem: true,
      richText: null,
    })

    await waitFor(() => {
      expect(within(messageCard).getByLabelText('summary')).toHaveTextContent(
        `TLDR: ${summary}`
      )
    })

    expect(submitSummary).not.toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeInTheDocument()
    expect(summaryInput).not.toBeInTheDocument()

    // open again
    expect(
      within(messageCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(messageCard).getByLabelText('summarize item'))

    expect(
      within(messageCard).queryByLabelText('summary')
    ).not.toBeInTheDocument()
    expect(within(messageCard).getByLabelText('Type summary here')).toHaveValue(
      summary
    )
    expect(
      within(messageCard).getByLabelText('Override item text')
    ).toBeChecked()
    expect(
      within(messageCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(messageCard).getByLabelText('delete summary')
    ).not.toBeDisabled()

    await userEvent.click(
      within(messageCard).getByLabelText('stop summarizing')
    )

    expect(
      within(messageCard).queryByLabelText('stop summarizing')
    ).not.toBeInTheDocument()
    expect(
      within(messageCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
    expect(
      within(messageCard).queryByLabelText('Override item text')
    ).not.toBeInTheDocument()
  })

  it('summarizes question', async () => {
    const question = questionFactory.build({
      summary: null,
    })

    const { screen, within, userEvent, waitFor } = await renderItemPage({
      id: question.id,
    })

    const questionCard = screen.getByTestId(`item-${question.id}`)
    const summarizeItem = within(questionCard).getByLabelText('summarize item')
    expect(summarizeItem).toBeInTheDocument()

    expect(
      within(questionCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()

    await userEvent.click(summarizeItem)

    const summaryInput =
      within(questionCard).getByLabelText('Type summary here')
    expect(summaryInput).toBeInTheDocument()
    expect(summaryInput).toHaveFocus()

    const shouldReplaceTextSwitch =
      within(questionCard).getByLabelText('Override item text')
    expect(shouldReplaceTextSwitch).toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeChecked()
    await userEvent.click(shouldReplaceTextSwitch)
    expect(shouldReplaceTextSwitch).toBeChecked()

    const submitSummary = within(questionCard).getByLabelText('submit summary')
    expect(submitSummary).toBeInTheDocument()
    expect(submitSummary).toBeDisabled()

    expect(
      within(questionCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(questionCard).getByLabelText('delete summary')
    ).toBeInTheDocument()
    expect(within(questionCard).getByLabelText('delete summary')).toBeDisabled()

    const summary = faker.lorem.word()

    await userEvent.type(summaryInput, summary)

    expect(within(questionCard).getByLabelText('delete summary')).toBeDisabled()

    const { requestInfo } = mockMutateSummarizeItem([question])

    await userEvent.click(submitSummary)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemId: question.id,
      text: summary,
      shouldReplaceOriginalItem: true,
      richText: null,
    })

    await waitFor(() => {
      expect(within(questionCard).getByLabelText('summary')).toHaveTextContent(
        `TLDR: ${summary}`
      )
    })

    expect(submitSummary).not.toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeInTheDocument()
    expect(summaryInput).not.toBeInTheDocument()

    // open again
    expect(
      within(questionCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(questionCard).getByLabelText('summarize item'))

    expect(
      within(questionCard).queryByLabelText('summary')
    ).not.toBeInTheDocument()
    expect(
      within(questionCard).getByLabelText('Type summary here')
    ).toHaveValue(summary)
    expect(
      within(questionCard).getByLabelText('Override item text')
    ).toBeChecked()
    expect(
      within(questionCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()

    expect(
      within(questionCard).getByLabelText('delete summary')
    ).not.toBeDisabled()

    await userEvent.click(
      within(questionCard).getByLabelText('stop summarizing')
    )

    expect(
      within(questionCard).queryByLabelText('stop summarizing')
    ).not.toBeInTheDocument()
    expect(
      within(questionCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
    expect(
      within(questionCard).queryByLabelText('Override item text')
    ).not.toBeInTheDocument()
  })

  it('summarizes task', async () => {
    const task = taskFactory.build({
      summary: null,
    })

    const { screen, within, userEvent, waitFor } = await renderItemPage({
      id: task.id,
    })

    const taskCard = screen.getByTestId(`item-${task.id}`)
    const summarizeItem = within(taskCard).getByLabelText('summarize item')
    expect(summarizeItem).toBeInTheDocument()

    expect(
      within(taskCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()

    await userEvent.click(summarizeItem)

    const summaryInput = within(taskCard).getByLabelText('Type summary here')
    expect(summaryInput).toBeInTheDocument()
    expect(summaryInput).toHaveFocus()

    const shouldReplaceTextSwitch =
      within(taskCard).getByLabelText('Override item text')
    expect(shouldReplaceTextSwitch).toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeChecked()
    await userEvent.click(shouldReplaceTextSwitch)
    expect(shouldReplaceTextSwitch).toBeChecked()

    const submitSummary = within(taskCard).getByLabelText('submit summary')
    expect(submitSummary).toBeInTheDocument()
    expect(submitSummary).toBeDisabled()

    expect(
      within(taskCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(taskCard).getByLabelText('delete summary')
    ).toBeInTheDocument()
    expect(within(taskCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const summary = faker.lorem.word()

    await userEvent.type(summaryInput, summary)

    expect(within(taskCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const { requestInfo } = mockMutateSummarizeItem([task])

    await userEvent.click(submitSummary)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemId: task.id,
      text: summary,
      shouldReplaceOriginalItem: true,
      richText: null,
    })

    await waitFor(() => {
      expect(within(taskCard).getByLabelText('summary')).toHaveTextContent(
        summary
      )
    })

    expect(submitSummary).not.toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeInTheDocument()
    expect(summaryInput).not.toBeInTheDocument()

    // open again
    expect(
      within(taskCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(taskCard).getByLabelText('summarize item'))

    expect(within(taskCard).queryByLabelText('summary')).not.toBeInTheDocument()
    expect(within(taskCard).getByLabelText('Type summary here')).toHaveValue(
      summary
    )
    expect(within(taskCard).getByLabelText('Override item text')).toBeChecked()
    expect(
      within(taskCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(within(taskCard).getByLabelText('delete summary')).not.toBeDisabled()

    await userEvent.click(within(taskCard).getByLabelText('stop summarizing'))

    expect(
      within(taskCard).queryByLabelText('stop summarizing')
    ).not.toBeInTheDocument()
    expect(
      within(taskCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
    expect(
      within(taskCard).queryByLabelText('Override item text')
    ).not.toBeInTheDocument()
  })

  it('summarizes info', async () => {
    const info = infoFactory.build({
      summary: null,
    })

    const { screen, within, userEvent, waitFor } = await renderItemPage({
      id: info.id,
    })

    const infoCard = screen.getByTestId(`item-${info.id}`)
    const summarizeItem = within(infoCard).getByLabelText('summarize item')
    expect(summarizeItem).toBeInTheDocument()

    expect(
      within(infoCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()

    await userEvent.click(summarizeItem)

    const summaryInput = within(infoCard).getByLabelText('Type summary here')
    expect(summaryInput).toBeInTheDocument()
    expect(summaryInput).toHaveFocus()

    const shouldReplaceTextSwitch =
      within(infoCard).getByLabelText('Override item text')
    expect(shouldReplaceTextSwitch).toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeChecked()
    await userEvent.click(shouldReplaceTextSwitch)
    expect(shouldReplaceTextSwitch).toBeChecked()

    const submitSummary = within(infoCard).getByLabelText('submit summary')
    expect(submitSummary).toBeInTheDocument()
    expect(submitSummary).toBeDisabled()

    expect(
      within(infoCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(infoCard).getByLabelText('delete summary')
    ).toBeInTheDocument()
    expect(within(infoCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const summary = faker.lorem.word()

    await userEvent.type(summaryInput, summary)

    expect(within(infoCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const { requestInfo } = mockMutateSummarizeItem([info])

    await userEvent.click(submitSummary)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemId: info.id,
      text: summary,
      shouldReplaceOriginalItem: true,
      richText: null,
    })

    await waitFor(() => {
      expect(within(infoCard).getByLabelText('summary')).toHaveTextContent(
        summary
      )
    })

    expect(submitSummary).not.toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeInTheDocument()
    expect(summaryInput).not.toBeInTheDocument()

    // open again
    expect(
      within(infoCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(infoCard).getByLabelText('summarize item'))

    expect(within(infoCard).queryByLabelText('summary')).not.toBeInTheDocument()
    expect(within(infoCard).getByLabelText('Type summary here')).toHaveValue(
      summary
    )
    expect(within(infoCard).getByLabelText('Override item text')).toBeChecked()
    expect(
      within(infoCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(within(infoCard).getByLabelText('delete summary')).not.toBeDisabled()

    await userEvent.click(within(infoCard).getByLabelText('stop summarizing'))

    expect(
      within(infoCard).queryByLabelText('stop summarizing')
    ).not.toBeInTheDocument()
    expect(
      within(infoCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
    expect(
      within(infoCard).queryByLabelText('Override item text')
    ).not.toBeInTheDocument()
  })

  it('summarizes goal', async () => {
    const goal = goalFactory.build({
      summary: null,
    })

    const { screen, within, userEvent, waitFor } = await renderItemPage({
      id: goal.id,
    })

    const goalCard = screen.getByTestId(`item-${goal.id}`)
    const summarizeItem = within(goalCard).getByLabelText('summarize item')
    expect(summarizeItem).toBeInTheDocument()

    expect(
      within(goalCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()

    await userEvent.click(summarizeItem)

    const summaryInput = within(goalCard).getByLabelText('Type summary here')
    expect(summaryInput).toBeInTheDocument()
    expect(summaryInput).toHaveFocus()

    const shouldReplaceTextSwitch =
      within(goalCard).getByLabelText('Override item text')
    expect(shouldReplaceTextSwitch).toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeChecked()
    await userEvent.click(shouldReplaceTextSwitch)
    expect(shouldReplaceTextSwitch).toBeChecked()

    const submitSummary = within(goalCard).getByLabelText('submit summary')
    expect(submitSummary).toBeInTheDocument()
    expect(submitSummary).toBeDisabled()

    expect(
      within(goalCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(
      within(goalCard).getByLabelText('delete summary')
    ).toBeInTheDocument()
    expect(within(goalCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const summary = faker.lorem.word()

    await userEvent.type(summaryInput, summary)

    expect(within(goalCard).getByLabelText('delete summary')).toHaveAttribute(
      'disabled'
    )

    const { requestInfo } = mockMutateSummarizeItem([goal])

    await userEvent.click(submitSummary)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemId: goal.id,
      text: summary,
      shouldReplaceOriginalItem: true,
      richText: null,
    })

    await waitFor(() => {
      expect(within(goalCard).getByLabelText('summary')).toHaveTextContent(
        summary
      )
    })

    expect(submitSummary).not.toBeInTheDocument()
    expect(shouldReplaceTextSwitch).not.toBeInTheDocument()
    expect(summaryInput).not.toBeInTheDocument()

    // open again
    expect(
      within(goalCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(goalCard).getByLabelText('summarize item'))

    expect(within(goalCard).queryByLabelText('summary')).not.toBeInTheDocument()
    expect(within(goalCard).getByLabelText('Type summary here')).toHaveValue(
      summary
    )
    expect(within(goalCard).getByLabelText('Override item text')).toBeChecked()
    expect(
      within(goalCard).getByLabelText('stop summarizing')
    ).toBeInTheDocument()
    expect(within(goalCard).getByLabelText('delete summary')).not.toBeDisabled()

    await userEvent.click(within(goalCard).getByLabelText('stop summarizing'))

    expect(
      within(goalCard).queryByLabelText('stop summarizing')
    ).not.toBeInTheDocument()
    expect(
      within(goalCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
    expect(
      within(goalCard).queryByLabelText('Override item text')
    ).not.toBeInTheDocument()
  })

  it('escape stops summarizing', async () => {
    const task = taskFactory.build({
      summary: null,
    })

    const { screen, within, userEvent } = await renderItemPage({
      id: task.id,
    })

    const taskCard = screen.getByTestId(`item-${task.id}`)

    expect(
      within(taskCard).getByLabelText('summarize item')
    ).toBeInTheDocument()

    await userEvent.click(within(taskCard).getByLabelText('summarize item'))

    expect(
      within(taskCard).queryByLabelText('summarize item')
    ).not.toBeInTheDocument()
    expect(
      within(taskCard).getByLabelText('Type summary here')
    ).toBeInTheDocument()

    expect(within(taskCard).getByLabelText('Type summary here')).toHaveFocus()

    await userEvent.keyboard('{Escape}')

    expect(
      within(taskCard).getByLabelText('summarize item')
    ).toBeInTheDocument()
    expect(
      within(taskCard).queryByLabelText('Type summary here')
    ).not.toBeInTheDocument()
  })

  describe('delete summary', () => {
    const message = messageFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const question = questionFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const task = taskFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })
    const info = infoFactory.build({
      summary: summaryFactory.build({ shouldReplaceOriginalItem: true }),
    })

    it.each`
      item        | itemType
      ${message}  | ${'message'}
      ${question} | ${'question'}
      ${task}     | ${'task'}
      ${info}     | ${'info'}
    `('deletes summary for $itemType', async ({ item }: { item: Item }) => {
      const { requestInfo } = mockMutateDeleteItemSummary()
      const { screen, within, userEvent, waitFor } = await renderItemPage({
        id: item.id,
      })

      const itemCard = screen.getByTestId(`item-${item.id}`)

      expect(requestInfo.calledTimes).toBe(0)

      expect(within(itemCard).getByLabelText('summary')).toBeInTheDocument()
      await userEvent.click(within(itemCard).getByLabelText('summarize item'))

      expect(
        within(itemCard).getByLabelText('delete summary')
      ).toBeInTheDocument()
      await userEvent.click(within(itemCard).getByLabelText('delete summary'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        itemId: item.id,
      })
      await waitFor(() => {
        expect(
          within(itemCard).queryByLabelText('delete summary')
        ).not.toBeInTheDocument()
      })
      expect(
        within(itemCard).queryByLabelText('summary')
      ).not.toBeInTheDocument()
    })
  })
})
