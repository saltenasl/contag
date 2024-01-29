import publicUserFactory from 'test/factories/publicUser'
import goalFactory from 'test/factories/goal'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import { Goal, File as GraphQLFile } from 'src/generated/graphql'
import itemFormDriver from 'test/drivers/item/form'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import fileFactory from 'test/factories/file'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import { STORAGE_ORIGIN } from 'test/config/setup'

describe('goals in the feed', () => {
  it('displays goals in the persons feed', async () => {
    const myProfile = userProfileFactory.build()
    const someUser = publicUserFactory.build()

    const goals = [
      goalFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
      }),
      goalFactory.build({
        author: someUser,
        sharedWith: [someUser, userToPublicUser(myProfile)],
      }),
    ]

    const { screen, within } = await renderAndNavigateToPersonsFeed({
      items: goals,
      myProfile,
    })

    goals.forEach((goal) => {
      const goalCard = screen.getByTestId(`item-${goal.id}`)

      expect(goalCard).toBeInTheDocument()

      expect(within(goalCard).getByLabelText('goal')).toBeInTheDocument()

      expect(within(goalCard).getByText(goal.text)).toBeInTheDocument()

      const authorContainer = within(goalCard).getByLabelText('author')
      expect(authorContainer).toBeInTheDocument()
      expect(
        within(authorContainer).getByLabelText(`${goal.author.name} avatar`)
      ).toBeInTheDocument()

      expect(
        within(goalCard).getByLabelText('open detailed view')
      ).toBeInTheDocument()

      expect(within(goalCard).getByText('Shared with:')).toBeInTheDocument()
      goal.sharedWith
        .filter(({ id }) => id !== goal.author.id)
        .forEach(({ name }) => {
          expect(
            within(
              within(goalCard).getByLabelText('shared with')
            ).getByLabelText(`${name} avatar`)
          ).toBeInTheDocument()
        })

      expect(
        within(goalCard).getByText(`Status: ${goal.goalStatus}`)
      ).toBeInTheDocument()
    })
  })
})

describe('creating a goal', () => {
  it('transitions from message creation to goal and back to message', async () => {
    const { screen, userEvent, within, personsFeed } =
      await renderAndNavigateToPersonsFeed()

    const convertToGoalButton = within(
      within(personsFeed).getByLabelText('convert item to type')
    ).getByLabelText('goal')
    expect(convertToGoalButton).toBeInTheDocument()

    await userEvent.click(convertToGoalButton)

    expect(screen.getByLabelText('Type goal title here')).toBeInTheDocument()

    const convertToMessageButton = within(
      within(personsFeed).getByLabelText('convert item to type')
    ).getByLabelText('message')
    expect(convertToMessageButton).toBeInTheDocument()

    await userEvent.click(convertToMessageButton)

    expect(screen.getByLabelText('Type message here')).toBeInTheDocument()
  })

  it('creates a basic goal and shares it with a person', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createGoalRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('goal')
    )

    const createButton = screen.getByLabelText('create')
    const textInput = screen.getByLabelText('Type goal title here')

    expect(createButton).toBeDisabled()

    const title = faker.lorem.sentence()
    await userEvent.type(textInput, title)

    expect(createButton).not.toBeDisabled()

    await userEvent.click(createButton)

    await waitFor(() => {
      expect(createGoalRequestInfo.calledTimes).toBe(1)
    })

    expect(createGoalRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: title,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: { completeUntil: null },
        attachments: [],
      },
    })

    await waitFor(() => {
      expect(textInput).toHaveValue('')
    })
    expect(screen.getByLabelText('create')).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it('creates a goal with complete until', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createGoalRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    expect(
      within(personsFeed).queryByLabelText('Complete until')
    ).not.toBeInTheDocument()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('goal')
    )

    expect(
      within(personsFeed).getByLabelText('Complete until')
    ).toBeInTheDocument()

    const completeUntilDateTimeString = dayjs()
      .add(1, 'hour')
      .format(DATE_TIME_PICKER_INPUT_FORMAT)

    const completeUntilInput =
      within(personsFeed).getByLabelText('Complete until')
    expect(completeUntilInput).toBeInTheDocument()
    await userEvent.type(completeUntilInput, completeUntilDateTimeString)
    expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

    const titleInput = screen.getByLabelText('Type goal title here')
    const title = faker.lorem.sentence()
    await userEvent.type(titleInput, title)

    await userEvent.click(screen.getByLabelText('create'))

    await waitFor(() => {
      expect(createGoalRequestInfo.calledTimes).toBe(1)
    })

    expect(createGoalRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: title,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: new Date(completeUntilDateTimeString).toISOString(),
        },
        attachments: [],
      },
    })

    const createdGoal = createGoalRequestInfo.calls[0].responseData
      .createGoal as Goal

    const goalCard = await waitFor(() => {
      const goalCard = within(personsFeed).getByTestId(`item-${createdGoal.id}`)
      expect(goalCard).toBeInTheDocument()

      return goalCard
    })

    expect(
      within(goalCard).getByLabelText('action expectation')
    ).toHaveTextContent(`Action expected by ${completeUntilDateTimeString}`)
  })

  it('creates goal with assignee', async () => {
    const {
      userEvent,
      waitFor,
      createGoalRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('goal')
    )

    const formDriver = itemFormDriver(personsFeed)

    const assigneesDriver = formDriver.assignees()
    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([])

    await assigneesDriver.options.open()
    await assigneesDriver.options.toggleOption(person.name)

    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([person.name])

    const textInput = within(personsFeed).getByLabelText('Type goal title here')
    const title = faker.lorem.sentence()
    await userEvent.type(textInput, title)

    await userEvent.click(within(personsFeed).getByLabelText('create'))

    await waitFor(() => {
      expect(createGoalRequestInfo.calledTimes).toBe(1)
    })

    expect(createGoalRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: title,
        richText: null,
        to: [{ id: person.id }],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: null,
        },
        attachments: [],
      },
    })

    const createdGoal = createGoalRequestInfo.calls[0].responseData
      .createGoal as Goal

    const goalCard = await waitFor(() => {
      const goalCard = within(personsFeed).getByTestId(`item-${createdGoal.id}`)
      expect(goalCard).toBeInTheDocument()

      return goalCard
    })

    expect(
      within(
        within(goalCard).getByLabelText('action expectation')
      ).getByLabelText(`${person.name} avatar`)
    ).toBeInTheDocument()
  })

  it('creates goal with an attachment', async () => {
    const {
      userEvent,
      waitFor,
      createGoalRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('goal')
    )

    const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()

    const itemForm = within(personsFeed).getByLabelText('item form')

    const title = faker.lorem.sentence()
    await userEvent.type(
      within(itemForm).getByLabelText('Type goal title here'),
      title
    )

    const { originalName, contentType } = fileFactory.build()
    const file = new File([''], originalName, { type: contentType })

    await userEvent.upload(
      within(itemForm).getByLabelText('upload attachment'),
      file
    )

    expect(createFileRequestInfo.calledTimes).toBe(1)
    expect(createFileRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        contentType,
        originalName,
        size: 0,
      },
    })

    const createdFile = createFileRequestInfo.calls[0].responseData
      .createFile as GraphQLFile

    expect(uploadFileToStorage).toHaveBeenCalledWith(createdFile.filename, file)

    await waitFor(() => {
      expect(
        within(itemForm).queryByLabelText('uploading')
      ).not.toBeInTheDocument()
    })

    const uploadLink = within(itemForm).getByText(originalName)
    expect(uploadLink).toBeInTheDocument()

    await waitFor(() => {
      expect(uploadLink).toHaveAttribute(
        'href',
        `${STORAGE_ORIGIN}/${createdFile.filename}`
      )
    })

    await userEvent.click(within(itemForm).getByLabelText('create'))

    await waitFor(() => {
      expect(createGoalRequestInfo.calledTimes).toBe(1)
    })

    expect(createGoalRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: title,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        attachments: [{ id: createdFile.id }],
        actionExpectation: {
          completeUntil: null,
        },
      },
    })

    const createdGoal = createGoalRequestInfo.calls[0].responseData
      .createGoal as Goal

    const goalCard = await waitFor(() => {
      const goalCard = within(personsFeed).getByTestId(`item-${createdGoal.id}`)

      expect(goalCard).toBeInTheDocument()

      return goalCard
    })

    expect(goalCard).toBeInTheDocument()
    const attachment = within(goalCard).getByText(originalName)
    expect(attachment).toBeInTheDocument()

    await waitFor(() => {
      expect(attachment).toHaveAttribute(
        'href',
        `${STORAGE_ORIGIN}/${createdFile.filename}`
      )
    })

    expect(within(itemForm).queryByLabelText('upload')).not.toBeInTheDocument()
  })
})
