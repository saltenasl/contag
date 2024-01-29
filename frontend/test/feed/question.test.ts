/* eslint-disable jest/no-conditional-expect */
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import userProfileFactory from 'test/factories/userProfile'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockMutateAmendQuestion from 'test/requestMocks/mutateAmendQuestion'
import { faker } from '@faker-js/faker'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'
import messageFactory from 'test/factories/message'
import taskFactory from 'test/factories/task'
import mockMutateAcceptAnswer from 'test/requestMocks/mutateAcceptAnswer'
import { Question, File as GraphQLFile } from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import dayjs from 'dayjs'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import { STORAGE_ORIGIN } from 'test/config/setup'
import infoFactory from 'test/factories/info'
import itemFormDriver from 'test/drivers/item/form'
import fileFactory from 'test/factories/file'

describe('questions in the feed', () => {
  it('displays questions in the persons feed', async () => {
    const myProfile = userProfileFactory.build()
    const someUser = publicUserFactory.build()

    const questions = [
      questionFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        acceptedAnswer: {
          text: faker.lorem.sentence(),
          richText: null,
        },
      }),
      questionFactory.build({
        author: someUser,
        sharedWith: [someUser, userToPublicUser(myProfile)],
      }),
    ]

    const { screen, within } = await renderAndNavigateToPersonsFeed({
      items: questions,
      myProfile,
    })

    questions.forEach((question) => {
      const questionCard = screen.getByTestId(`item-${question.id}`)

      expect(questionCard).toBeInTheDocument()

      expect(
        within(questionCard).getByLabelText('question')
      ).toBeInTheDocument()

      expect(within(questionCard).getByText(question.text)).toBeInTheDocument()

      const authorContainer = within(questionCard).getByLabelText('author')
      expect(authorContainer).toBeInTheDocument()
      expect(
        within(authorContainer).getByLabelText(`${question.author.name} avatar`)
      ).toBeInTheDocument()

      expect(
        within(questionCard).getByLabelText('open detailed view')
      ).toBeInTheDocument()

      expect(within(questionCard).getByText('Shared with:')).toBeInTheDocument()
      question.sharedWith
        .filter(({ id }) => id !== question.author.id)
        .forEach(({ name }) => {
          expect(
            within(
              within(questionCard).getByLabelText('shared with')
            ).getByLabelText(`${name} avatar`)
          ).toBeInTheDocument()
        })

      if (question.acceptedAnswer) {
        const acceptedAnswerCard =
          within(questionCard).getByLabelText('accepted answer')

        expect(acceptedAnswerCard).toBeInTheDocument()
        expect(acceptedAnswerCard).toHaveTextContent(
          question.acceptedAnswer.text
        )
      } else {
        expect(
          within(questionCard).queryByLabelText('accepted answer')
        ).not.toBeInTheDocument()
      }
    })
  })
})

describe('creating a question', () => {
  it('creates a basic question and shares it with a person', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createQuestionRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('question')
    )

    const createButton = screen.getByLabelText('create')
    const textInput = screen.getByLabelText('Type question here')

    expect(createButton).toBeDisabled()

    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    expect(createButton).not.toBeDisabled()

    await userEvent.click(createButton)

    await waitFor(() => {
      expect(createQuestionRequestInfo.calledTimes).toBe(1)
    })

    expect(createQuestionRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
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
      expect(screen.getByText(text)).toBeInTheDocument()
    })
  })

  it('creates a question with complete until', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createQuestionRequestInfo,
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
      ).getByLabelText('question')
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

    const textInput = screen.getByLabelText('Type question here')
    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    await userEvent.click(screen.getByLabelText('create'))

    await waitFor(() => {
      expect(createQuestionRequestInfo.calledTimes).toBe(1)
    })

    expect(createQuestionRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: new Date(completeUntilDateTimeString).toISOString(),
        },
        attachments: [],
      },
    })

    const createdQuestion = createQuestionRequestInfo.calls[0].responseData
      .createQuestion as Question

    const questionCard = await waitFor(() => {
      const questionCard = within(personsFeed).getByTestId(
        `item-${createdQuestion.id}`
      )
      expect(questionCard).toBeInTheDocument()

      return questionCard
    })

    expect(
      within(questionCard).getByLabelText('action expectation')
    ).toHaveTextContent(`Action expected by ${completeUntilDateTimeString}`)
  })

  it('creates question with assignee', async () => {
    const {
      userEvent,
      waitFor,
      createQuestionRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('question')
    )

    const formDriver = itemFormDriver(personsFeed)

    const assigneesDriver = formDriver.assignees()
    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([])

    await assigneesDriver.options.open()
    await assigneesDriver.options.toggleOption(person.name)

    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([person.name])

    const textInput = within(personsFeed).getByLabelText('Type question here')
    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    await userEvent.click(within(personsFeed).getByLabelText('create'))

    await waitFor(() => {
      expect(createQuestionRequestInfo.calledTimes).toBe(1)
    })

    expect(createQuestionRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [{ id: person.id }],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: null,
        },
        attachments: [],
      },
    })

    const createdQuestion = createQuestionRequestInfo.calls[0].responseData
      .createQuestion as Question

    const questionCard = await waitFor(() => {
      const questionCard = within(personsFeed).getByTestId(
        `item-${createdQuestion.id}`
      )
      expect(questionCard).toBeInTheDocument()

      return questionCard
    })

    expect(
      within(
        within(questionCard).getByLabelText('action expectation')
      ).getByLabelText(`${person.name} avatar`)
    ).toBeInTheDocument()
  })

  it('creates question with an attachment', async () => {
    const {
      userEvent,
      waitFor,
      createQuestionRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('question')
    )

    const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()

    const itemForm = within(personsFeed).getByLabelText('item form')

    const text = faker.lorem.sentence()
    await userEvent.type(
      within(itemForm).getByLabelText('Type question here'),
      text
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
      expect(createQuestionRequestInfo.calledTimes).toBe(1)
    })

    expect(createQuestionRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        attachments: [{ id: createdFile.id }],
        actionExpectation: {
          completeUntil: null,
        },
      },
    })

    const createdQuestion = createQuestionRequestInfo.calls[0].responseData
      .createQuestion as Question

    const questionCard = await waitFor(() => {
      const questionCard = within(personsFeed).getByTestId(
        `item-${createdQuestion.id}`
      )

      expect(questionCard).toBeInTheDocument()

      return questionCard
    })

    expect(questionCard).toBeInTheDocument()
    const attachment = within(questionCard).getByText(originalName)
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

describe('nesting', () => {
  const renderQuestionAndAnswersFeeds = async () => {
    const myProfile = userProfileFactory.build()
    const parentQuestion = questionFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      actionExpectation: actionExpectationFactory.build(),
    })

    const nestedMessageItem = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentQuestion.id,
    })

    const nestedTaskItem = taskFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentQuestion.id,
    })

    const nestedQuestionItem = questionFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentQuestion.id,
    })

    const nestedInfoItem = infoFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentQuestion.id,
    })

    const utils = await renderAndNavigateToNestedFeed({
      myProfile,
      parentFeedItems: [parentQuestion],
      nestedItems: [
        nestedMessageItem,
        nestedTaskItem,
        nestedQuestionItem,
        nestedInfoItem,
      ],
    })

    return {
      ...utils,
      nestedMessageItem,
      nestedTaskItem,
      nestedQuestionItem,
      nestedInfoItem,
    }
  }

  it('displays a button to accept as the answer for items that have isAcceptedAnswer value as bool', async () => {
    const { nestedItems, within, nestedFeed, personsFeed } =
      await renderQuestionAndAnswersFeeds()

    expect(
      within(personsFeed).queryByLabelText('accept as the answer')
    ).not.toBeInTheDocument()

    nestedItems.forEach((item) => {
      const itemCard = within(nestedFeed).getByTestId(`item-${item.id}`)

      expect(itemCard).toBeInTheDocument()
      expect(
        within(itemCard).getByLabelText('accept as the answer')
      ).toBeInTheDocument()
    })
  })

  it.each(['Message', 'Task', 'Question', 'Info'])(
    'accepts %s as an answer',
    async (type) => {
      const {
        within,
        nestedFeed,
        personsFeed,
        parentItem,
        userEvent,
        waitFor,
        ...rest
      } = await renderQuestionAndAnswersFeeds()

      // @ts-expect-error i don't know a better way to do this, given i want this to be in a it.each block
      const answer = rest[`nested${type}Item`]

      const { requestInfo: acceptAnswerRequestInfo } = mockMutateAcceptAnswer()

      const parentItemCard = within(personsFeed).getByTestId(
        `item-${parentItem.id}`
      )
      expect(
        within(parentItemCard).queryByLabelText('accepted answer')
      ).not.toBeInTheDocument()
      expect(
        within(parentItemCard).getByText('Action expected')
      ).toBeInTheDocument()
      expect(acceptAnswerRequestInfo.calledTimes).toBe(0)

      const answerCard = within(nestedFeed).getByTestId(`item-${answer.id}`)
      await userEvent.click(
        within(answerCard).getByLabelText('accept as the answer')
      )

      expect(acceptAnswerRequestInfo.calledTimes).toBe(1)
      expect(acceptAnswerRequestInfo.calls[0].requestVariables).toStrictEqual({
        itemId: answer.id,
      })

      await waitFor(() => {
        expect(
          within(answerCard).getByLabelText('this is the accepted answer')
        ).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(parentItemCard).getByLabelText('accepted answer')
        ).toHaveTextContent(answer.text)
      })

      expect(
        within(parentItemCard).queryByText('Action expected')
      ).not.toBeInTheDocument()
    }
  )

  it('unmarks another answer as correct after accepting a new one', async () => {
    const myProfile = userProfileFactory.build()
    const parentQuestion = questionFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
    })

    const nestedAnswer = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: true,
      parentId: parentQuestion.id,
    })

    const nestedToBeAnswer = messageFactory.build({
      author: userToPublicUser(myProfile),
      sharedWith: [userToPublicUser(myProfile)],
      isAcceptedAnswer: false,
      parentId: parentQuestion.id,
    })

    mockMutateAcceptAnswer()

    const { nestedFeed, within, userEvent, waitFor } =
      await renderAndNavigateToNestedFeed({
        myProfile,
        parentFeedItems: [parentQuestion],
        nestedItems: [nestedAnswer, nestedToBeAnswer],
      })

    const answerCard = within(nestedFeed).getByTestId(`item-${nestedAnswer.id}`)
    expect(answerCard).toBeInTheDocument()
    expect(
      within(answerCard).getByLabelText('this is the accepted answer')
    ).toBeInTheDocument()

    const toBeAnswerCard = within(nestedFeed).getByTestId(
      `item-${nestedToBeAnswer.id}`
    )

    await userEvent.click(
      within(toBeAnswerCard).getByLabelText('accept as the answer')
    )

    await waitFor(() => {
      expect(
        within(answerCard).queryByLabelText('this is the accepted answer')
      ).not.toBeInTheDocument()
    })
  })

  it('when question is marked as an answer - updates questions correct answer upon editing question text', async () => {
    const myProfile = userProfileFactory.build()
    const answerText = faker.lorem.sentence()
    const question = questionFactory.build({
      acceptedAnswer: {
        text: answerText,
        richText: null,
      },
    })
    const answer = questionFactory.build({
      text: answerText,
      isAcceptedAnswer: true,
      parentId: question.id,
    })

    mockMutateAmendQuestion()

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
      within(answerCard).getByLabelText('Type question here')
    )
    const updatedAnswerText = faker.lorem.sentence()
    await userEvent.type(
      within(answerCard).getByLabelText('Type question here'),
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
