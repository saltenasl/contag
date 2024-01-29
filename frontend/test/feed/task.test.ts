import { faker } from '@faker-js/faker'
import { Task, File as GraphQLFile } from 'src/generated/graphql'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockMutateAmendTask from 'test/requestMocks/mutateAmendTask'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'
import dayjs from 'dayjs'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import { STORAGE_ORIGIN } from 'test/config/setup'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import itemFormDriver from 'test/drivers/item/form'
import fileFactory from 'test/factories/file'

describe('tasks in the feed', () => {
  it('displays tasks in the persons feed', async () => {
    const myProfile = userProfileFactory.build()
    const someUser = publicUserFactory.build()

    const tasks = [
      taskFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
      }),
      taskFactory.build({
        author: someUser,
        sharedWith: [someUser, userToPublicUser(myProfile)],
      }),
    ]

    const { screen, within } = await renderAndNavigateToPersonsFeed({
      items: tasks,
      myProfile,
    })

    tasks.forEach((task) => {
      const taskCard = screen.getByTestId(`item-${task.id}`)

      expect(taskCard).toBeInTheDocument()

      expect(within(taskCard).getByLabelText('task')).toBeInTheDocument()

      expect(within(taskCard).getByText(task.text)).toBeInTheDocument()

      const authorContainer = within(taskCard).getByLabelText('author')
      expect(authorContainer).toBeInTheDocument()
      expect(
        within(authorContainer).getByLabelText(`${task.author.name} avatar`)
      ).toBeInTheDocument()

      expect(
        within(taskCard).getByLabelText('open detailed view')
      ).toBeInTheDocument()

      expect(within(taskCard).getByText('Shared with:')).toBeInTheDocument()
      task.sharedWith
        .filter(({ id }) => id !== task.author.id)
        .forEach(({ name }) => {
          expect(
            within(
              within(taskCard).getByLabelText('shared with')
            ).getByLabelText(`${name} avatar`)
          ).toBeInTheDocument()
        })

      expect(
        within(taskCard).getByText(`Status: ${task.status}`)
      ).toBeInTheDocument()
    })
  })

  it('when task is marked as an answer - updates questions correct answer upon editing task text', async () => {
    const myProfile = userProfileFactory.build()
    const answerText = faker.lorem.sentence()
    const question = questionFactory.build({
      acceptedAnswer: {
        text: answerText,
        richText: null,
      },
    })
    const answer = taskFactory.build({
      text: answerText,
      isAcceptedAnswer: true,
      parentId: question.id,
    })

    mockMutateAmendTask()

    const { personsFeed, nestedFeed, within, userEvent, waitFor } =
      await renderAndNavigateToNestedFeed({
        myProfile,
        parentFeedItems: [question],
        nestedItems: [answer],
      })

    const questionCard = within(personsFeed).getByTestId(`item-${question.id}`)
    expect(
      within(questionCard).getByLabelText('accepted answer')
    ).toHaveTextContent(answer.text)

    const answerCard = within(nestedFeed).getByTestId(`item-${answer.id}`)

    await userEvent.click(within(answerCard).getByLabelText('edit'))

    await userEvent.clear(
      within(answerCard).getByLabelText('Type task description here')
    )
    const updatedAnswerText = faker.lorem.sentence()
    await userEvent.type(
      within(answerCard).getByLabelText('Type task description here'),
      updatedAnswerText,
      { skipClick: true }
    )
    await userEvent.click(within(answerCard).getByLabelText('submit edit'))

    await waitFor(() => {
      expect(
        within(questionCard).getByLabelText('accepted answer')
      ).toHaveTextContent(updatedAnswerText)
    })
  })
})

describe('creating a task', () => {
  it('transitions from message creation to task and back to message', async () => {
    const { screen, userEvent, within, personsFeed } =
      await renderAndNavigateToPersonsFeed()

    const convertToTaskButton = within(
      within(personsFeed).getByLabelText('convert item to type')
    ).getByLabelText('task')
    expect(convertToTaskButton).toBeInTheDocument()

    await userEvent.click(convertToTaskButton)

    expect(
      screen.getByLabelText('Type task description here')
    ).toBeInTheDocument()

    const convertToMessageButton = within(
      within(personsFeed).getByLabelText('convert item to type')
    ).getByLabelText('message')
    expect(convertToMessageButton).toBeInTheDocument()

    await userEvent.click(convertToMessageButton)

    expect(screen.getByLabelText('Type message here')).toBeInTheDocument()
  })

  it('creates a basic task and shares it with a person', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createTaskRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('task')
    )

    const createButton = screen.getByLabelText('create')
    const textInput = screen.getByLabelText('Type task description here')

    expect(createButton).toBeDisabled()

    const description = faker.lorem.sentence()
    await userEvent.type(textInput, description)

    expect(createButton).not.toBeDisabled()

    await userEvent.click(createButton)

    await waitFor(() => {
      expect(createTaskRequestInfo.calledTimes).toBe(1)
    })

    expect(createTaskRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: description,
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
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  it('creates a task with complete until', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createTaskRequestInfo,
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
      ).getByLabelText('task')
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

    const descriptionInput = screen.getByLabelText('Type task description here')
    const description = faker.lorem.sentence()
    await userEvent.type(descriptionInput, description)

    await userEvent.click(screen.getByLabelText('create'))

    await waitFor(() => {
      expect(createTaskRequestInfo.calledTimes).toBe(1)
    })

    expect(createTaskRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: description,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: new Date(completeUntilDateTimeString).toISOString(),
        },
        attachments: [],
      },
    })

    const createdTask = createTaskRequestInfo.calls[0].responseData
      .createTask as Task

    const taskCard = await waitFor(() => {
      const taskCard = within(personsFeed).getByTestId(`item-${createdTask.id}`)
      expect(taskCard).toBeInTheDocument()

      return taskCard
    })

    expect(
      within(taskCard).getByLabelText('action expectation')
    ).toHaveTextContent(`Action expected by ${completeUntilDateTimeString}`)
  })

  it('creates task with assignee', async () => {
    const {
      userEvent,
      waitFor,
      createTaskRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('task')
    )

    const formDriver = itemFormDriver(personsFeed)

    const assigneesDriver = formDriver.assignees()
    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([])

    await assigneesDriver.options.open()
    await assigneesDriver.options.toggleOption(person.name)

    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([person.name])

    const textInput = within(personsFeed).getByLabelText(
      'Type task description here'
    )
    const description = faker.lorem.sentence()
    await userEvent.type(textInput, description)

    await userEvent.click(within(personsFeed).getByLabelText('create'))

    await waitFor(() => {
      expect(createTaskRequestInfo.calledTimes).toBe(1)
    })

    expect(createTaskRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: description,
        richText: null,
        to: [{ id: person.id }],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: null,
        },
        attachments: [],
      },
    })

    const createdTask = createTaskRequestInfo.calls[0].responseData
      .createTask as Task

    const taskCard = await waitFor(() => {
      const taskCard = within(personsFeed).getByTestId(`item-${createdTask.id}`)
      expect(taskCard).toBeInTheDocument()

      return taskCard
    })

    expect(
      within(
        within(taskCard).getByLabelText('action expectation')
      ).getByLabelText(`${person.name} avatar`)
    ).toBeInTheDocument()
  })

  it('creates task with an attachment', async () => {
    const {
      userEvent,
      waitFor,
      createTaskRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('task')
    )

    const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()

    const itemForm = within(personsFeed).getByLabelText('item form')

    const description = faker.lorem.sentence()
    await userEvent.type(
      within(itemForm).getByLabelText('Type task description here'),
      description
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
      expect(createTaskRequestInfo.calledTimes).toBe(1)
    })

    expect(createTaskRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text: description,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        attachments: [{ id: createdFile.id }],
        actionExpectation: {
          completeUntil: null,
        },
      },
    })

    const createdTask = createTaskRequestInfo.calls[0].responseData
      .createTask as Task

    const taskCard = await waitFor(() => {
      const taskCard = within(personsFeed).getByTestId(`item-${createdTask.id}`)

      expect(taskCard).toBeInTheDocument()

      return taskCard
    })

    expect(taskCard).toBeInTheDocument()
    const attachment = within(taskCard).getByText(originalName)
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
