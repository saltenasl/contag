import { ItemType } from 'src/generated/graphql'
import messageFactory from 'test/factories/message'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockMutateConvertItem from 'test/requestMocks/mutateConvertItem'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'

describe('convertItem', () => {
  it('converts message to a task', async () => {
    const { requestInfo } = mockMutateConvertItem()
    const message = messageFactory.build()
    const { personsFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToPersonsFeed({
        items: [message],
      })

    const messageCard = within(personsFeed).getByTestId(`item-${message.id}`)
    expect(messageCard).toBeInTheDocument()

    const convertItemButton = within(messageCard).getByLabelText('convert item')
    expect(convertItemButton).toBeInTheDocument()

    await userEvent.click(convertItemButton)

    const convertToTaskButton = screen.getByText('Convert to Task')
    expect(convertToTaskButton).toBeInTheDocument()

    expect(screen.getByText('Convert to Message')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    expect(requestInfo.calledTimes).toBe(0)

    await userEvent.click(convertToTaskButton)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0]).toStrictEqual(
      expect.objectContaining({
        requestVariables: { input: { to: ItemType.Task, itemId: message.id } },
      })
    )

    await waitFor(() => {
      expect(messageCard).not.toBeInTheDocument()
    })
    expect(
      within(personsFeed).getByTestId(`item-${message.id}`)
    ).toBeInTheDocument()
  })

  it('converts task to a message', async () => {
    const { requestInfo } = mockMutateConvertItem()
    const task = taskFactory.build()
    const { personsFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToPersonsFeed({
        items: [task],
      })

    const taskCard = within(personsFeed).getByTestId(`item-${task.id}`)
    expect(taskCard).toBeInTheDocument()

    const convertItemButton = within(taskCard).getByLabelText('convert item')
    expect(convertItemButton).toBeInTheDocument()

    await userEvent.click(convertItemButton)

    const convertToMessageButton = screen.getByText('Convert to Message')
    expect(convertToMessageButton).toBeInTheDocument()

    expect(screen.getByText('Convert to Task')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    expect(requestInfo.calledTimes).toBe(0)

    await userEvent.click(convertToMessageButton)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0]).toStrictEqual(
      expect.objectContaining({
        requestVariables: { input: { to: ItemType.Message, itemId: task.id } },
      })
    )

    await waitFor(() => {
      expect(taskCard).not.toBeInTheDocument()
    })
    expect(
      within(personsFeed).getByTestId(`item-${task.id}`)
    ).toBeInTheDocument()
  })

  it('converts message to a question', async () => {
    const { requestInfo } = mockMutateConvertItem()
    const message = messageFactory.build()
    const { personsFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToPersonsFeed({
        items: [message],
      })

    const messageCard = within(personsFeed).getByTestId(`item-${message.id}`)
    expect(messageCard).toBeInTheDocument()

    const convertItemButton = within(messageCard).getByLabelText('convert item')
    expect(convertItemButton).toBeInTheDocument()

    await userEvent.click(convertItemButton)

    const convertToQuestionButton = screen.getByText('Convert to Question')
    expect(convertToQuestionButton).toBeInTheDocument()

    expect(screen.getByText('Convert to Message')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    expect(requestInfo.calledTimes).toBe(0)

    await userEvent.click(convertToQuestionButton)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0]).toStrictEqual(
      expect.objectContaining({
        requestVariables: {
          input: { to: ItemType.Question, itemId: message.id },
        },
      })
    )

    await waitFor(() => {
      expect(messageCard).not.toBeInTheDocument()
    })
    expect(
      within(personsFeed).getByTestId(`item-${message.id}`)
    ).toBeInTheDocument()
  })

  it('converts message to info', async () => {
    const { requestInfo } = mockMutateConvertItem()
    const message = messageFactory.build()
    const { personsFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToPersonsFeed({
        items: [message],
      })

    const messageCard = within(personsFeed).getByTestId(`item-${message.id}`)
    expect(messageCard).toBeInTheDocument()

    const convertItemButton = within(messageCard).getByLabelText('convert item')
    expect(convertItemButton).toBeInTheDocument()

    await userEvent.click(convertItemButton)

    const convertToInfoButton = screen.getByText('Convert to Info')
    expect(convertToInfoButton).toBeInTheDocument()

    expect(screen.getByText('Convert to Message')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    expect(requestInfo.calledTimes).toBe(0)

    await userEvent.click(convertToInfoButton)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0]).toStrictEqual(
      expect.objectContaining({
        requestVariables: {
          input: { to: ItemType.Info, itemId: message.id },
        },
      })
    )

    await waitFor(() => {
      expect(messageCard).not.toBeInTheDocument()
    })
    expect(
      within(personsFeed).getByTestId(`item-${message.id}`)
    ).toBeInTheDocument()
  })

  it('converts message to goal', async () => {
    const { requestInfo } = mockMutateConvertItem()
    const message = messageFactory.build()
    const { personsFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToPersonsFeed({
        items: [message],
      })

    const messageCard = within(personsFeed).getByTestId(`item-${message.id}`)
    expect(messageCard).toBeInTheDocument()

    const convertItemButton = within(messageCard).getByLabelText('convert item')
    expect(convertItemButton).toBeInTheDocument()

    await userEvent.click(convertItemButton)

    const convertToGoalButton = screen.getByText('Convert to Goal')
    expect(convertToGoalButton).toBeInTheDocument()

    expect(screen.getByText('Convert to Message')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    expect(requestInfo.calledTimes).toBe(0)

    await userEvent.click(convertToGoalButton)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0]).toStrictEqual(
      expect.objectContaining({
        requestVariables: {
          input: { to: ItemType.Goal, itemId: message.id },
        },
      })
    )

    await waitFor(() => {
      expect(messageCard).not.toBeInTheDocument()
    })
    expect(
      within(personsFeed).getByTestId(`item-${message.id}`)
    ).toBeInTheDocument()
  })

  it('hides "accept as the answer" in child feed items when question is converted to any other type', async () => {
    mockMutateConvertItem()
    const myProfile = userProfileFactory.build()
    const parentItem = questionFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
    })

    const nestedItem = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentItem.id,
    })

    const { personsFeed, nestedFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToNestedFeed({
        myProfile,
        parentFeedItems: [parentItem],
        nestedItems: [nestedItem],
      })

    expect(
      within(nestedFeed).getByLabelText('accept as the answer')
    ).toBeInTheDocument()

    const itemCard = within(personsFeed).getByTestId(`item-${parentItem.id}`)
    await userEvent.click(within(itemCard).getByLabelText('convert item'))

    await userEvent.click(screen.getByText('Convert to Message'))

    await waitFor(() => {
      expect(
        within(nestedFeed).queryByLabelText('accept as the answer')
      ).not.toBeInTheDocument()
    })
  })

  it('displays "accept as the answer" in child feed items when item is converted to question', async () => {
    mockMutateConvertItem()
    const myProfile = userProfileFactory.build()
    const parentItem = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
    })

    const nestedItem = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      parentId: parentItem.id,
    })

    const { personsFeed, nestedFeed, within, userEvent, waitFor, screen } =
      await renderAndNavigateToNestedFeed({
        myProfile,
        parentFeedItems: [parentItem],
        nestedItems: [nestedItem],
      })

    expect(
      within(nestedFeed).queryByLabelText('accept as the answer')
    ).not.toBeInTheDocument()

    const itemCard = within(personsFeed).getByTestId(`item-${parentItem.id}`)
    await userEvent.click(within(itemCard).getByLabelText('convert item'))

    await userEvent.click(screen.getByText('Convert to Question'))

    await waitFor(() => {
      expect(
        within(nestedFeed).getByLabelText('accept as the answer')
      ).toBeInTheDocument()
    })
  })
})
