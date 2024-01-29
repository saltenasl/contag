import { faker } from '@faker-js/faker'
import {
  ItemsSortOrder,
  ItemsSortType,
  File as GraphQLFile,
  Message,
} from 'src/generated/graphql'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockMutateAmendMessage from 'test/requestMocks/mutateAmendMessage'
import renderAndNavigateToNestedFeed from './utils/renderAndNavigateToNestedFeed'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import { STORAGE_ORIGIN } from 'test/config/setup'
import fileFactory from 'test/factories/file'

describe('messages in the feed', () => {
  it('displays messages in the persons feed', async () => {
    const myProfile = userProfileFactory.build()
    const someUser = publicUserFactory.build()

    const messages = [
      messageFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
      }),
      messageFactory.build({
        author: someUser,
        sharedWith: [someUser, userToPublicUser(myProfile)],
      }),
    ]

    const { screen, getFeedRequestInfo, person, within } =
      await renderAndNavigateToPersonsFeed({
        items: messages,
        myProfile,
      })

    expect(getFeedRequestInfo.calls).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestVariables: {
            sort: {
              type: ItemsSortType.CreatedAt,
              order: ItemsSortOrder.NewestFirst,
            },
            filters: {
              parentId: person.id,
            },
          },
        }),
      ])
    )

    messages.forEach((message) => {
      const messageCard = screen.getByTestId(`item-${message.id}`)

      expect(messageCard).toBeInTheDocument()

      expect(within(messageCard).queryByLabelText('message')).toBeNull()

      const authorContainer = within(messageCard).getByLabelText('author')
      expect(authorContainer).toBeInTheDocument()
      expect(
        within(authorContainer).getByLabelText(`${message.author.name} avatar`)
      ).toBeInTheDocument()

      expect(
        within(messageCard).getByLabelText('open detailed view')
      ).toBeInTheDocument()

      expect(within(messageCard).getByText('Shared with:')).toBeInTheDocument()
      message.sharedWith
        .filter(({ id }) => id !== message.author.id)
        .forEach(({ name }) => {
          expect(
            within(
              within(messageCard).getByLabelText('shared with')
            ).getByLabelText(`${name} avatar`)
          ).toBeInTheDocument()
        })

      expect(
        within(messageCard).queryByText('0 child items')
      ).not.toBeInTheDocument()
    })
  })

  it('when message is marked as an answer - updates questions correct answer upon editing message text', async () => {
    const myProfile = userProfileFactory.build()
    const answerText = faker.lorem.sentence()
    const question = questionFactory.build({
      acceptedAnswer: {
        text: answerText,
        richText: null,
      },
    })
    const answer = messageFactory.build({
      text: answerText,
      isAcceptedAnswer: true,
      parentId: question.id,
    })

    mockMutateAmendMessage()

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
      within(answerCard).getByLabelText('Type message here')
    )
    const updatedAnswerText = faker.lorem.sentence()
    await userEvent.type(
      within(answerCard).getByLabelText('Type message here'),
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

describe('send message', () => {
  it('sends a message to a person', async () => {
    const {
      userEvent,
      waitFor,
      sendMessageRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    const sendButton = within(personsFeed).getByLabelText('send')

    expect(sendButton).toBeDisabled()
    expect(
      within(personsFeed).queryByLabelText('Assignee')
    ).not.toBeInTheDocument()

    const textInput = within(personsFeed).getByLabelText('Type message here')
    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    expect(sendButton).not.toBeDisabled()

    await userEvent.click(sendButton)

    await waitFor(() => {
      expect(sendMessageRequestInfo.calledTimes).toBe(1)
    })

    expect(sendMessageRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        shareWith: [{ id: person.id }],
        attachments: [],
      },
    })

    await waitFor(() => {
      expect(textInput).toHaveValue('')
    })

    expect(within(personsFeed).getByLabelText('send')).toBeDisabled()

    await waitFor(() => {
      expect(within(personsFeed).getByText(text)).toBeInTheDocument()
    })
  })

  it('sends message with an attachment', async () => {
    const {
      userEvent,
      waitFor,
      sendMessageRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()

    const itemForm = within(personsFeed).getByLabelText('item form')

    const text = faker.lorem.sentence()
    await userEvent.type(
      within(itemForm).getByLabelText('Type message here'),
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

    await userEvent.click(within(itemForm).getByLabelText('send'))

    await waitFor(() => {
      expect(sendMessageRequestInfo.calledTimes).toBe(1)
    })

    expect(sendMessageRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        shareWith: [{ id: person.id }],
        attachments: [{ id: createdFile.id }],
      },
    })

    const createdMessage = sendMessageRequestInfo.calls[0].responseData
      .sendMessage as Message

    const messageCard = await waitFor(() => {
      const messageCard = within(personsFeed).getByTestId(
        `item-${createdMessage.id}`
      )

      expect(messageCard).toBeInTheDocument()

      return messageCard
    })

    expect(messageCard).toBeInTheDocument()
    const attachment = within(messageCard).getByText(originalName)
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
