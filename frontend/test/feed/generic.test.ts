import { faker } from '@faker-js/faker'
import taskFactory from 'test/factories/task'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import userProfileFactory from 'test/factories/userProfile'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'
import { Message } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import mockMutateAmendTask from 'test/requestMocks/mutateAmendTask'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import messageFactory from 'test/factories/message'
import mockGetItem from 'test/requestMocks/getItem'
import infoFactory from 'test/factories/info'
import goalFactory from 'test/factories/goal'
import questionFactory from 'test/factories/question'

describe('generic', () => {
  it.todo('shows loader while fetching feed')

  it("doesn't show blocks/blocked by when they are empty", async () => {
    const items = [
      messageFactory.build(),
      infoFactory.build(),
      taskFactory.build(),
      goalFactory.build(),
      questionFactory.build(),
    ]
    const { within, personsFeed } = await renderAndNavigateToPersonsFeed({
      items,
    })

    expect(
      within(personsFeed).queryByText('Blocks (0)')
    ).not.toBeInTheDocument()
    expect(
      within(personsFeed).queryByText('Blocked by (0)')
    ).not.toBeInTheDocument()
  })

  it('navigates to detailed view for any item', async () => {
    mockGetItem()
    const message = messageFactory.build()
    const { within, personsFeed, userEvent, getLocation } =
      await renderAndNavigateToPersonsFeed({ items: [message] })

    const messageCard = within(personsFeed).getByTestId(`item-${message.id}`)
    const openDetailedView =
      within(messageCard).getByLabelText('open detailed view')
    expect(openDetailedView).toHaveAttribute('href', `/item/${message.id}`)

    await userEvent.click(openDetailedView)

    expect(getLocation().pathname).toBe(`/item/${message.id}`)
  })

  it('item creation form is closed when feed has items opens and closes it', async () => {
    const { within, personsFeed, userEvent } =
      await renderAndNavigateToPersonsFeed({ items: [messageFactory.build()] })

    expect(
      within(personsFeed).queryByLabelText('item form')
    ).not.toBeInTheDocument()
    const addItemButton = within(personsFeed).getByLabelText('add item')
    expect(addItemButton).toBeInTheDocument()

    await userEvent.click(addItemButton)

    expect(
      within(personsFeed).queryByLabelText('add item')
    ).not.toBeInTheDocument()
    expect(within(personsFeed).getByLabelText('item form')).toBeInTheDocument()
    const closeFormButton =
      within(personsFeed).getByLabelText('close item form')
    expect(closeFormButton).toBeInTheDocument()

    await userEvent.click(closeFormButton)

    expect(
      within(personsFeed).queryByLabelText('item form')
    ).not.toBeInTheDocument()
  })

  it('has item creation form open by default when feed has no items', async () => {
    const { within, personsFeed } = await renderAndNavigateToPersonsFeed({
      items: [],
    })

    expect(within(personsFeed).getByLabelText('item form')).toBeInTheDocument()
    expect(
      within(personsFeed).queryByLabelText('add item')
    ).not.toBeInTheDocument()
  })

  it('submits item (with all attributes) edit without changing anything', async () => {
    const myProfile = userProfileFactory.build()
    const task = taskFactory.build({
      author: userToPublicUser(myProfile),
      richText: JSON.parse(faker.datatype.json()),
      actionExpectation: actionExpectationFactory.build({
        completeUntil: new Date().toISOString(),
      }),
      to: [userToPublicUser(myProfile)],
      sharedWith: [userToPublicUser(myProfile)],
    })

    const { userEvent, within, personsFeed } =
      await renderAndNavigateToPersonsFeed({
        items: [task],
        myProfile,
      })

    const { requestInfo } = mockMutateAmendTask()

    const taskCard = within(personsFeed).getByTestId(`item-${task.id}`)

    await userEvent.click(within(taskCard).getByLabelText('edit'))

    await userEvent.click(within(taskCard).getByLabelText('submit edit'))

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        id: task.id,
        text: task.text,
        richText: task.richText,
        to: task.to.map(({ id }) => ({ id })),
        actionExpectation: {
          completeUntil: task.actionExpectation?.completeUntil,
        },
        attachments: [],
        sharedWith: [{ id: myProfile.id }],
      },
    })
  })

  it('create form validation for question (since form is generic for all the same applies to other types)', async () => {
    const { within, personsFeed, userEvent } =
      await renderAndNavigateToPersonsFeed()

    const itemForm = within(personsFeed).getByLabelText('item form')

    await userEvent.click(
      within(
        within(itemForm).getByLabelText('convert item to type')
      ).getByLabelText('question')
    )
    await userEvent.type(
      within(itemForm).getByLabelText('Type question here'),
      faker.lorem.word()
    )
    expect(within(itemForm).getByLabelText('create')).not.toBeDisabled()

    await userEvent.clear(within(itemForm).getByLabelText('Type question here'))
    expect(within(itemForm).getByLabelText('create')).toBeDisabled()

    await userEvent.type(
      within(itemForm).getByLabelText('Type question here'),
      faker.lorem.word()
    )
    expect(within(itemForm).getByLabelText('create')).not.toBeDisabled()

    await userEvent.type(
      within(itemForm).getByLabelText('Complete until'),
      '111' // invalid date
    )
    expect(within(itemForm).getByLabelText('create')).toBeDisabled()

    await userEvent.clear(within(itemForm).getByLabelText('Complete until'))
    expect(within(itemForm).getByLabelText('create')).not.toBeDisabled()

    mockMutateCreateFile()
    jest.mocked(uploadFileToStorage).mockResolvedValue(new Promise(() => {}))
    await userEvent.upload(
      within(itemForm).getByLabelText('upload attachment'),
      new File([''], 'file name')
    )

    expect(within(itemForm).getByLabelText('create')).toBeDisabled()
  })
})

describe('feed query params', () => {
  it.todo('stores feed configuration in query parameters')

  it.todo('loads feed configuration from query parameters')
})

describe('nesting', () => {
  it('opens nested feed when message is clicked', async () => {
    const { nestedItems, nestedFeed, within } =
      await renderAndNavigateToNestedFeed()
    const nestedMessage = nestedItems[0] as Message

    expect(within(nestedFeed).getByText(nestedMessage.text)).toBeInTheDocument()
    expect(within(nestedFeed).getByLabelText('add item')).toBeInTheDocument()
  })

  it('sends a message to nested feed', async () => {
    const text = faker.lorem.sentence()

    const {
      parentItem,
      nestedFeed,
      within,
      userEvent,
      sendMessageRequestInfo,
      waitFor,
      personsFeed,
    } = await renderAndNavigateToNestedFeed()

    const parentMessageCard = within(personsFeed).getByTestId(
      `item-${parentItem.id}`
    )
    expect(parentMessageCard).toBeInTheDocument()
    expect(
      within(parentMessageCard).queryByText('1 child item')
    ).not.toBeInTheDocument()

    await userEvent.click(within(nestedFeed).getByLabelText('add item'))

    await userEvent.type(
      within(nestedFeed).getByLabelText('Type message here'),
      text
    )

    await userEvent.click(within(nestedFeed).getByLabelText('send'))

    await waitFor(() => {
      expect(sendMessageRequestInfo.calledTimes).toBe(1)
    })

    expect(sendMessageRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        parentId: parentItem.id,
        attachments: [],
      },
    })

    await waitFor(() => {
      expect(within(nestedFeed).getByText(text)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        within(
          within(personsFeed).getByTestId(`item-${parentItem.id}`)
        ).getByText('1 child item')
      ).toBeInTheDocument()
    })
  })

  it('updates parent item childCount when task is created', async () => {
    const { nestedFeed, within, screen, userEvent, waitFor, parentItem } =
      await renderAndNavigateToNestedFeed()

    await userEvent.click(within(nestedFeed).getByLabelText('add item'))

    await userEvent.click(
      within(
        within(nestedFeed).getByLabelText('convert item to type')
      ).getByLabelText('task')
    )

    await userEvent.type(
      within(nestedFeed).getByLabelText('Type task description here'),
      faker.lorem.sentence()
    )

    await userEvent.click(within(nestedFeed).getByLabelText('create'))

    const parentMessageCard = screen.getByTestId(`item-${parentItem.id}`)
    expect(parentMessageCard).toBeInTheDocument()

    await waitFor(() => {
      expect(
        within(parentMessageCard).getByText('1 child item')
      ).toBeInTheDocument()
    })
  })
})
