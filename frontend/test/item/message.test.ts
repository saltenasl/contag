import { faker } from '@faker-js/faker'
import {
  Message,
  File as GraphQLFile,
  PublicUser,
  ItemType,
} from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import summaryFactory from 'test/factories/summary'
import taskFactory from 'test/factories/task'
import userProfileFactory from 'test/factories/userProfile'
import mockGetChildren from 'test/requestMocks/getChildren'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import renderItemPage from './utils/renderItemPage'
import mockMutateAmendMessage from 'test/requestMocks/mutateAmendMessage'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import fileFactory from 'test/factories/file'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import itemFormDriver from 'test/drivers/item/form'
import itemCardDriver from 'test/drivers/item/card'

describe('message', () => {
  describe('card', () => {
    it('renders', async () => {
      const message = messageFactory.build()
      const { container } = await renderItemPage({ id: message.id })

      const cardDriver = itemCardDriver(container, message.id)

      expect(cardDriver.text).toBe(message.text)
      expect(cardDriver.openDetailedView.isRendered()).toBe(false)

      expect(cardDriver.goals.header()).toBe(`Goals (0)`)
    })

    it('child count and child summary', async () => {
      const myProfile = userProfileFactory.build()
      const someUser = publicUserFactory.build()
      const childCount = 1

      const message = messageFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        childCount,
      })

      const childInfo = infoFactory.build({ parentId: message.id })
      const childMessage = messageFactory.build({
        parentId: message.id,
        text: faker.lorem.sentences(16),
      })
      const childQuestion = questionFactory.build({ parentId: message.id })
      const childTask = taskFactory.build({
        parentId: message.id,
        to: [userToPublicUser(myProfile)],
      })
      const summarizedChild = messageFactory.build({
        parentId: message.id,
        summary: summaryFactory.build(),
      })
      const actionExpectedChild = taskFactory.build({
        parentId: message.id,
        actionExpectation: actionExpectationFactory.build(),
      })

      const children = [
        childInfo,
        childMessage,
        childQuestion,
        childTask,
        summarizedChild,
        actionExpectedChild,
      ]

      const { within, userEvent, screen, waitFor } = await renderItemPage({
        id: message.id,
        myProfile,
      })
      const { requestInfo } = mockGetChildren()

      const messageCard = screen.getByTestId(`item-${message.id}`)
      const childCountButton = within(messageCard).getByText(
        `${childCount} child item`
      )
      expect(childCountButton).toBeInTheDocument()
      expect(
        within(messageCard).queryByLabelText('children summary')
      ).not.toBeInTheDocument()

      await userEvent.click(childCountButton)

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: expect.objectContaining({ parentId: message.id }),
        })
      )

      const childrenSummary =
        within(messageCard).getByLabelText('children summary')

      await waitFor(() => {
        expect(
          within(childrenSummary).queryByLabelText('Loading')
        ).not.toBeInTheDocument()
      })

      children.forEach((childItem) => {
        const childSummary = within(childrenSummary).getByTestId(
          `item-${childItem.id}-summary`
        )

        expect(
          within(childSummary).getByLabelText(
            // @ts-expect-error typename will never be undefined
            childItem.__typename?.toLowerCase()
          )
        ).toBeInTheDocument()

        const text =
          childItem.text.length > 200
            ? childItem.text.substring(0, 200) + '...'
            : childItem.text

        expect(within(childSummary).getByText(text)).toBeInTheDocument()

        if ('actionExpectation' in childItem && childItem.actionExpectation) {
          expect(
            within(childSummary).getByLabelText('action expectation')
          ).toBeInTheDocument()
        } else {
          expect(
            within(childSummary).queryByLabelText('action expectation')
          ).not.toBeInTheDocument()
        }

        if (childItem.to.length !== 0) {
          childItem.to.forEach((person) => {
            expect(
              within(childSummary).getByLabelText(`${person.name} avatar`)
            ).toBeInTheDocument()
          })
        } else {
          expect(
            within(childSummary).queryByLabelText(/ avatar/i)
          ).not.toBeInTheDocument()
        }
      })
    })
  })

  describe('edit', () => {
    const renderAndOpenMessageEdit = async (
      additionalMessageProps: Partial<Message> = {},
      {
        myProfile = userProfileFactory.build(),
        publicUsers = [userToPublicUser(myProfile)],
      }: {
        myProfile?: ReturnType<typeof userProfileFactory.build>
        publicUsers?: PublicUser[]
      } = {}
    ) => {
      const message = messageFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile)],
        ...additionalMessageProps,
      })

      mockGetPublicUsers(publicUsers)

      const { within, screen, userEvent, waitFor } = await renderItemPage({
        id: message.id,
        myProfile,
      })

      const messageCard = screen.getByTestId(`item-${message.id}`)

      const editButton = within(messageCard).getByLabelText('edit')

      expect(editButton).toBeInTheDocument()

      await userEvent.click(editButton)

      return { within, messageCard, message, userEvent, myProfile, waitFor }
    }

    it('edits a message', async () => {
      const { within, messageCard, message, userEvent, waitFor, myProfile } =
        await renderAndOpenMessageEdit()
      const { requestInfo } = mockMutateAmendMessage()

      const messageInput =
        within(messageCard).getByLabelText('Type message here')
      expect(messageInput).toBeInTheDocument()
      expect(messageInput).toHaveValue(message.text)

      expect(
        within(messageCard).queryByLabelText('Assignee')
      ).not.toBeInTheDocument()

      expect(
        within(messageCard).queryByLabelText('convert to task')
      ).not.toBeInTheDocument()
      expect(
        within(messageCard).getByLabelText('submit edit')
      ).toBeInTheDocument()
      expect(
        within(messageCard).getByLabelText('stop editing')
      ).toBeInTheDocument()

      await userEvent.clear(
        within(messageCard).getByLabelText('Type message here')
      )
      const text = faker.lorem.sentence()
      await userEvent.type(
        within(messageCard).getByLabelText('Type message here'),
        text,
        { skipClick: true }
      )
      expect(
        within(messageCard).getByLabelText('Type message here')
      ).toHaveValue(text)

      await userEvent.click(within(messageCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: message.id,
              text,
              richText: null,
              attachments: [],
              sharedWith: [{ id: myProfile.id }],
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(messageCard).queryByLabelText('Type message here')
        ).not.toBeInTheDocument()
      })
      await waitFor(() => {
        expect(within(messageCard).getByText(text)).toBeInTheDocument()
      })
    })

    it('edits attachments', async () => {
      const existingAttachment = fileFactory.build()
      const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()
      const { requestInfo } = mockMutateAmendMessage()
      const { within, userEvent, messageCard, waitFor } =
        await renderAndOpenMessageEdit({
          attachments: [existingAttachment],
        })

      const existingAttachmentElement = within(messageCard).getByText(
        existingAttachment.originalName
      )
      expect(existingAttachmentElement).toBeInTheDocument()

      await userEvent.click(
        within(messageCard).getByLabelText(
          `delete ${existingAttachment.originalName}`
        )
      )
      expect(existingAttachmentElement).not.toBeInTheDocument()

      const { originalName, contentType } = fileFactory.build()
      const file = new File([''], originalName, { type: contentType })

      await userEvent.upload(
        within(messageCard).getByLabelText('upload attachment'),
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
      await waitFor(() => {
        expect(
          within(messageCard).queryByLabelText('uploading')
        ).not.toBeInTheDocument()
      })

      const addedAttachment = createFileRequestInfo.calls[0].responseData
        .createFile as GraphQLFile

      await userEvent.click(within(messageCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          attachments: [{ id: addedAttachment.id }],
        }),
      })

      await waitFor(() => {
        expect(
          within(messageCard).queryByLabelText('submit edit')
        ).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(messageCard).queryByText(existingAttachment.originalName)
        ).not.toBeInTheDocument()
      })
      expect(
        within(messageCard).getByText(addedAttachment.originalName)
      ).toBeInTheDocument()
    })

    it('edits shared with', async () => {
      const myProfile = userProfileFactory.build()
      const otherUser = userProfileFactory.build()
      const { requestInfo } = mockMutateAmendMessage()

      const { messageCard, within, waitFor } = await renderAndOpenMessageEdit(
        {},
        {
          myProfile,
          publicUsers: [
            userToPublicUser(myProfile),
            userToPublicUser(otherUser),
          ],
        }
      )

      const formDriver = itemFormDriver(messageCard)
      const sharedWithDriver = formDriver.sharedWith()

      expect(sharedWithDriver.getSelectedOptions()).toStrictEqual([
        myProfile.name,
      ])

      sharedWithDriver.options.isNotRendered()
      await sharedWithDriver.options.open()
      sharedWithDriver.options.isRendered()

      expect(sharedWithDriver.options.listDisabled()).toStrictEqual([
        myProfile.name,
      ])

      sharedWithDriver.options.toggleOption(otherUser.name)

      await formDriver.submit({
        isEditing: true,
        itemType: ItemType.Message,
      })

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables.input).toStrictEqual(
        expect.objectContaining({
          sharedWith: expect.arrayContaining([
            { id: myProfile.id },
            { id: otherUser.id },
          ]),
        })
      )
      expect(
        requestInfo.calls[0].requestVariables.input.sharedWith
      ).toHaveLength(2)

      await waitFor(() => {
        formDriver.isClosed()
      })

      const sharedWith = within(messageCard).getByLabelText('shared with')
      expect(
        within(sharedWith).getByLabelText(`${otherUser.name} avatar`)
      ).toBeInTheDocument()
    })

    it('stop editing button resets the card to the default', async () => {
      const { within, messageCard, userEvent } =
        await renderAndOpenMessageEdit()

      const stopEditingButton =
        within(messageCard).getByLabelText('stop editing')
      expect(stopEditingButton).toBeInTheDocument()
      expect(
        within(messageCard).getByLabelText('Type message here')
      ).toBeInTheDocument()

      await userEvent.click(stopEditingButton)

      expect(
        within(messageCard).queryByLabelText('Type message here')
      ).not.toBeInTheDocument()
    })

    it('escape stops editing', async () => {
      const { within, messageCard, userEvent } =
        await renderAndOpenMessageEdit()

      expect(
        within(messageCard).getByLabelText('Type message here')
      ).toHaveFocus()

      await userEvent.keyboard('{Escape}')

      expect(
        within(messageCard).queryByLabelText('Type message here')
      ).not.toBeInTheDocument()
    })
  })
})
