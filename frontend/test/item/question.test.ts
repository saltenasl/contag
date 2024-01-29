import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import {
  Question,
  File as GraphQLFile,
  PublicUser,
  ItemType,
} from 'src/generated/graphql'
import actionExpectationFactory from 'test/factories/actionExpectation'
import fileFactory from 'test/factories/file'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import summaryFactory from 'test/factories/summary'
import taskFactory from 'test/factories/task'
import userProfileFactory from 'test/factories/userProfile'
import mockGetChildren from 'test/requestMocks/getChildren'
import mockMutateAmendQuestion from 'test/requestMocks/mutateAmendQuestion'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderItemPage from './utils/renderItemPage'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import itemFormDriver from 'test/drivers/item/form'
import itemCardDriver from 'test/drivers/item/card'

describe('question', () => {
  describe('card', () => {
    it('renders', async () => {
      const question = questionFactory.build()
      const { container } = await renderItemPage({ id: question.id })

      const cardDriver = itemCardDriver(container, question.id)

      expect(cardDriver.text).toBe(question.text)
      expect(cardDriver.openDetailedView.isRendered()).toBe(false)

      expect(cardDriver.goals.header()).toBe(`Goals (0)`)
    })

    it('child count and child summary', async () => {
      const myProfile = userProfileFactory.build()
      const someUser = publicUserFactory.build()
      const childCount = 1

      const question = questionFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        childCount,
      })

      const childInfo = infoFactory.build({ parentId: question.id })
      const childMessage = messageFactory.build({ parentId: question.id })
      const childQuestion = questionFactory.build({ parentId: question.id })
      const childTask = taskFactory.build({
        parentId: question.id,
        to: [userToPublicUser(myProfile)],
      })
      const summarizedChild = messageFactory.build({
        parentId: question.id,
        summary: summaryFactory.build(),
      })
      const actionExpectedChild = taskFactory.build({
        parentId: question.id,
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
        id: question.id,
        myProfile,
      })
      const { requestInfo } = mockGetChildren()

      const messageCard = screen.getByTestId(`item-${question.id}`)
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
          filters: expect.objectContaining({ parentId: question.id }),
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
    const renderAndOpenQuestionEdit = async (
      additionalQuestionProps: Partial<Question> = {},
      {
        myProfile = userProfileFactory.build(),
        publicUsers = [],
      }: {
        myProfile?: ReturnType<typeof userProfileFactory.build>
        publicUsers?: PublicUser[]
      } = {}
    ) => {
      const question = questionFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile)],
        ...additionalQuestionProps,
      })

      mockGetPublicUsers(publicUsers)

      const { within, screen, userEvent, waitFor } = await renderItemPage({
        id: question.id,
        myProfile,
      })

      const questionCard = screen.getByTestId(`item-${question.id}`)

      expect(within(questionCard).getByLabelText('edit')).toBeInTheDocument()

      await userEvent.click(within(questionCard).getByLabelText('edit'))

      expect(
        within(questionCard).queryByLabelText('edit')
      ).not.toBeInTheDocument()

      return { within, questionCard, question, userEvent, myProfile, waitFor }
    }

    it('edits a question', async () => {
      const { requestInfo } = mockMutateAmendQuestion()
      const { within, questionCard, question, userEvent, waitFor, myProfile } =
        await renderAndOpenQuestionEdit()

      const questionInput =
        within(questionCard).getByLabelText('Type question here')
      expect(questionInput).toBeInTheDocument()
      expect(questionInput).toHaveValue(question.text)

      expect(
        within(questionCard).getByLabelText('submit edit')
      ).toBeInTheDocument()
      expect(
        within(questionCard).getByLabelText('stop editing')
      ).toBeInTheDocument()

      const text = faker.lorem.sentence()
      await userEvent.clear(
        within(questionCard).getByLabelText('Type question here')
      )
      await userEvent.type(
        within(questionCard).getByLabelText('Type question here'),
        text,
        { skipClick: true }
      )
      expect(
        within(questionCard).getByLabelText('Type question here')
      ).toHaveValue(text)

      await userEvent.click(within(questionCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: question.id,
              text,
              richText: null,
              actionExpectation: { completeUntil: null },
              to: [],
              attachments: [],
              sharedWith: [{ id: myProfile.id }],
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(questionCard).queryByLabelText('Type question here')
        ).not.toBeInTheDocument()
      })
      expect(within(questionCard).getByText(text)).toBeInTheDocument()
    })

    it('edits complete until and assignee', async () => {
      const myProfile = userProfileFactory.build()
      const dateForReference = new Date()
      const completeUntilInitialDateTimeString = dayjs(dateForReference)
        .add(1, 'hour')
        .format(DATE_TIME_PICKER_INPUT_FORMAT)

      const potentialAssignees = [
        userToPublicUser(myProfile),
        publicUserFactory.build(),
      ]

      const { within, questionCard, userEvent, waitFor } =
        await renderAndOpenQuestionEdit(
          {
            actionExpectation: actionExpectationFactory.build({
              completeUntil: new Date(
                completeUntilInitialDateTimeString
              ).toISOString(),
            }),
            to: [userToPublicUser(myProfile)],
            sharedWith: [userToPublicUser(myProfile)],
          },
          {
            myProfile,
            publicUsers: potentialAssignees,
          }
        )
      const { requestInfo } = mockMutateAmendQuestion()

      expect(requestInfo.calledTimes).toBe(0)

      const completeUntilInput =
        within(questionCard).getByLabelText('Complete until')

      expect(completeUntilInput).toBeInTheDocument()
      expect(completeUntilInput).toHaveValue(completeUntilInitialDateTimeString)

      const completeUntilDateTimeString = dayjs(dateForReference)
        .add(2, 'hour')
        .format(DATE_TIME_PICKER_INPUT_FORMAT)

      await userEvent.clear(completeUntilInput)
      await userEvent.type(completeUntilInput, completeUntilDateTimeString)
      expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

      const formDriver = itemFormDriver(questionCard)

      const assigneesDriver = formDriver.assignees()
      assigneesDriver.options.isNotRendered()
      assigneesDriver.isOptionSelected(myProfile.name)

      await assigneesDriver.options.open()
      assigneesDriver.options.isRendered()

      await Promise.all([
        potentialAssignees.map(async ({ name, email }) =>
          assigneesDriver.options.toggleOption(name ?? email)
        ),
      ])
      await userEvent.click(within(questionCard).getByLabelText('submit edit'))

      const newAssignees = potentialAssignees.filter(
        ({ id }) => id !== myProfile.id
      )

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          actionExpectation: {
            completeUntil: new Date(completeUntilDateTimeString).toISOString(),
          },
          to: newAssignees.map(({ id }) => ({ id })),
        }),
      })

      await waitFor(() => {
        expect(
          within(questionCard).getByLabelText('action expectation')
        ).toHaveTextContent(
          `Action expected by by ${completeUntilDateTimeString}`
        )
      })

      newAssignees.forEach((assignee) => {
        expect(
          within(
            within(questionCard).getByLabelText('action expectation')
          ).getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })

    it('edits attachments', async () => {
      const existingAttachment = fileFactory.build()
      const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()
      const { requestInfo } = mockMutateAmendQuestion()
      const { within, userEvent, questionCard, waitFor } =
        await renderAndOpenQuestionEdit({
          attachments: [existingAttachment],
        })

      const existingAttachmentElement = within(questionCard).getByText(
        existingAttachment.originalName
      )
      expect(existingAttachmentElement).toBeInTheDocument()

      await userEvent.click(
        within(questionCard).getByLabelText(
          `delete ${existingAttachment.originalName}`
        )
      )
      expect(existingAttachmentElement).not.toBeInTheDocument()

      const { originalName, contentType } = fileFactory.build()
      const file = new File([''], originalName, { type: contentType })

      await userEvent.upload(
        within(questionCard).getByLabelText('upload attachment'),
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
          within(questionCard).queryByLabelText('uploading')
        ).not.toBeInTheDocument()
      })

      const addedAttachment = createFileRequestInfo.calls[0].responseData
        .createFile as GraphQLFile

      await userEvent.click(within(questionCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          attachments: [{ id: addedAttachment.id }],
        }),
      })

      await waitFor(() => {
        expect(
          within(questionCard).queryByLabelText('submit edit')
        ).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(questionCard).queryByText(existingAttachment.originalName)
        ).not.toBeInTheDocument()
      })
      expect(
        within(questionCard).getByText(addedAttachment.originalName)
      ).toBeInTheDocument()
    })
    it('edits shared with', async () => {
      const myProfile = userProfileFactory.build()
      const otherUser = userProfileFactory.build()
      const { requestInfo } = mockMutateAmendQuestion()

      const { questionCard, within, waitFor } = await renderAndOpenQuestionEdit(
        {},
        {
          myProfile,
          publicUsers: [
            userToPublicUser(myProfile),
            userToPublicUser(otherUser),
          ],
        }
      )

      const formDriver = itemFormDriver(questionCard)
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
        itemType: ItemType.Question,
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

      const sharedWith = within(questionCard).getByLabelText('shared with')
      expect(
        within(sharedWith).getByLabelText(`${otherUser.name} avatar`)
      ).toBeInTheDocument()
    })

    it('stop editing button resets the card to the default', async () => {
      const { within, questionCard, userEvent } =
        await renderAndOpenQuestionEdit()

      const stopEditingButton =
        within(questionCard).getByLabelText('stop editing')
      expect(stopEditingButton).toBeInTheDocument()
      expect(
        within(questionCard).getByLabelText('Type question here')
      ).toBeInTheDocument()

      await userEvent.click(stopEditingButton)

      expect(
        within(questionCard).queryByLabelText('Type question here')
      ).not.toBeInTheDocument()
    })

    it('escape stops editing', async () => {
      const { within, questionCard, userEvent } =
        await renderAndOpenQuestionEdit()

      expect(
        within(questionCard).getByLabelText('Type question here')
      ).toHaveFocus()

      await userEvent.keyboard('{Escape}')

      expect(
        within(questionCard).queryByLabelText('Type question here')
      ).not.toBeInTheDocument()
    })
  })
})
