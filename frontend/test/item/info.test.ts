import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import {
  Info,
  File as GraphQLFile,
  PublicUser,
  ItemType,
} from 'src/generated/graphql'
import itemCardDriver from 'test/drivers/item/card'
import itemFormDriver from 'test/drivers/item/form'
import actionExpectationFactory from 'test/factories/actionExpectation'
import fileFactory from 'test/factories/file'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import summaryFactory from 'test/factories/summary'
import taskFactory from 'test/factories/task'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetChildren from 'test/requestMocks/getChildren'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import mockMutateAmendInfo from 'test/requestMocks/mutateAmendInfo'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderItemPage from './utils/renderItemPage'

describe('info', () => {
  describe('card', () => {
    it('renders', async () => {
      const info = infoFactory.build()
      const { container } = await renderItemPage({ id: info.id })

      const cardDriver = itemCardDriver(container, info.id)

      expect(cardDriver.text).toBe(info.text)
      expect(cardDriver.openDetailedView.isRendered()).toBe(false)

      expect(cardDriver.goals.header()).toBe(`Goals (0)`)
    })

    it('acknowledges info', async () => {
      const { requestInfo } = mockMutateAmendInfo()
      const info = infoFactory.build()

      const { userEvent, within, screen } = await renderItemPage({
        id: info.id,
      })

      const infoCard = screen.getByTestId(`item-${info.id}`)

      expect(requestInfo.calledTimes).toBe(0)

      await userEvent.click(within(infoCard).getByText('Acknowledge'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: { id: info.id, acknowledged: true },
      })
    })

    it('child count and child summary', async () => {
      const myProfile = userProfileFactory.build()
      const someUser = publicUserFactory.build()
      const childCount = 1

      const info = infoFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        childCount,
      })

      const childInfo = infoFactory.build({ parentId: info.id })
      const childMessage = messageFactory.build({ parentId: info.id })
      const childQuestion = questionFactory.build({ parentId: info.id })
      const childTask = taskFactory.build({
        parentId: info.id,
        to: [userToPublicUser(myProfile)],
      })
      const summarizedChild = messageFactory.build({
        parentId: info.id,
        summary: summaryFactory.build(),
      })
      const actionExpectedChild = taskFactory.build({
        parentId: info.id,
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
        id: info.id,
        myProfile,
      })

      const { requestInfo } = mockGetChildren()

      const messageCard = screen.getByTestId(`item-${info.id}`)
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
          filters: expect.objectContaining({ parentId: info.id }),
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
    const renderAndOpenEdit = async (
      additionalInfoProps: Partial<Info> = {},
      {
        myProfile = userProfileFactory.build(),
        publicUsers = [],
      }: {
        myProfile?: ReturnType<typeof userProfileFactory.build>
        publicUsers?: PublicUser[]
      } = {}
    ) => {
      const info = infoFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile)],
        ...additionalInfoProps,
      })

      mockGetPublicUsers(publicUsers)

      const { within, screen, userEvent, waitFor } = await renderItemPage({
        id: info.id,
        myProfile,
      })

      const infoCard = screen.getByTestId(`item-${info.id}`)

      expect(within(infoCard).getByLabelText('edit')).toBeInTheDocument()

      await userEvent.click(within(infoCard).getByLabelText('edit'))

      expect(within(infoCard).queryByLabelText('edit')).not.toBeInTheDocument()

      return { within, infoCard, info, userEvent, myProfile, waitFor }
    }

    it('edits a info', async () => {
      const { requestInfo } = mockMutateAmendInfo()
      const { within, infoCard, info, userEvent, waitFor, myProfile } =
        await renderAndOpenEdit()

      expect(
        within(infoCard).queryByText('Acknowledge')
      ).not.toBeInTheDocument()

      const infoInput = within(infoCard).getByLabelText('Type info here')
      expect(infoInput).toBeInTheDocument()
      expect(infoInput).toHaveValue(info.text)

      expect(
        within(infoCard).queryByLabelText('convert to info')
      ).not.toBeInTheDocument()
      expect(within(infoCard).getByLabelText('submit edit')).toBeInTheDocument()
      expect(
        within(infoCard).getByLabelText('stop editing')
      ).toBeInTheDocument()

      const text = faker.lorem.sentence()
      await userEvent.clear(within(infoCard).getByLabelText('Type info here'))
      await userEvent.type(
        within(infoCard).getByLabelText('Type info here'),
        text,
        { skipClick: true }
      )
      expect(within(infoCard).getByLabelText('Type info here')).toHaveValue(
        text
      )

      await userEvent.click(within(infoCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: info.id,
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
          within(infoCard).queryByLabelText('Type info here')
        ).not.toBeInTheDocument()
      })
      expect(within(infoCard).getByText(text)).toBeInTheDocument()
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

      const { within, infoCard, userEvent, waitFor } = await renderAndOpenEdit(
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
      const { requestInfo } = mockMutateAmendInfo()

      expect(requestInfo.calledTimes).toBe(0)

      const completeUntilInput =
        within(infoCard).getByLabelText('Complete until')

      expect(completeUntilInput).toBeInTheDocument()
      expect(completeUntilInput).toHaveValue(completeUntilInitialDateTimeString)

      const completeUntilDateTimeString = dayjs(dateForReference)
        .add(2, 'hour')
        .format(DATE_TIME_PICKER_INPUT_FORMAT)

      await userEvent.clear(completeUntilInput)
      await userEvent.type(completeUntilInput, completeUntilDateTimeString)
      expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

      const formDriver = itemFormDriver(infoCard)

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

      await userEvent.click(within(infoCard).getByLabelText('submit edit'))

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
          within(infoCard).getByLabelText('action expectation')
        ).toHaveTextContent(
          `Action expected by by ${completeUntilDateTimeString}`
        )
      })
      newAssignees.forEach((assignee) => {
        expect(
          within(
            within(infoCard).getByLabelText('action expectation')
          ).getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })

    it('edits attachments', async () => {
      const existingAttachment = fileFactory.build()
      const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()
      const { requestInfo } = mockMutateAmendInfo()
      const { within, userEvent, infoCard, waitFor } = await renderAndOpenEdit({
        attachments: [existingAttachment],
      })

      const existingAttachmentElement = within(infoCard).getByText(
        existingAttachment.originalName
      )
      expect(existingAttachmentElement).toBeInTheDocument()

      await userEvent.click(
        within(infoCard).getByLabelText(
          `delete ${existingAttachment.originalName}`
        )
      )
      expect(existingAttachmentElement).not.toBeInTheDocument()

      const { originalName, contentType } = fileFactory.build()
      const file = new File([''], originalName, { type: contentType })

      await userEvent.upload(
        within(infoCard).getByLabelText('upload attachment'),
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
          within(infoCard).queryByLabelText('uploading')
        ).not.toBeInTheDocument()
      })

      const addedAttachment = createFileRequestInfo.calls[0].responseData
        .createFile as GraphQLFile

      await userEvent.click(within(infoCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          attachments: [{ id: addedAttachment.id }],
        }),
      })

      await waitFor(() => {
        expect(
          within(infoCard).queryByLabelText('submit edit')
        ).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(infoCard).queryByText(existingAttachment.originalName)
        ).not.toBeInTheDocument()
      })
      expect(
        within(infoCard).getByText(addedAttachment.originalName)
      ).toBeInTheDocument()
    })

    it('edits shared with', async () => {
      const myProfile = userProfileFactory.build()
      const otherUser = userProfileFactory.build()
      const { requestInfo } = mockMutateAmendInfo()

      const { infoCard, within, waitFor } = await renderAndOpenEdit(
        {},
        {
          myProfile,
          publicUsers: [
            userToPublicUser(myProfile),
            userToPublicUser(otherUser),
          ],
        }
      )

      const formDriver = itemFormDriver(infoCard)
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
        itemType: ItemType.Info,
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

      const sharedWith = within(infoCard).getByLabelText('shared with')
      expect(
        within(sharedWith).getByLabelText(`${otherUser.name} avatar`)
      ).toBeInTheDocument()
    })

    it('stop editing button resets the card to the default', async () => {
      const { within, infoCard, userEvent } = await renderAndOpenEdit()

      const stopEditingButton = within(infoCard).getByLabelText('stop editing')
      expect(stopEditingButton).toBeInTheDocument()
      expect(
        within(infoCard).getByLabelText('Type info here')
      ).toBeInTheDocument()

      await userEvent.click(stopEditingButton)

      expect(
        within(infoCard).queryByLabelText('Type info here')
      ).not.toBeInTheDocument()
    })

    it('escape stops editing', async () => {
      const { within, infoCard, userEvent } = await renderAndOpenEdit()

      expect(within(infoCard).getByLabelText('Type info here')).toHaveFocus()

      await userEvent.keyboard('{Escape}')

      expect(
        within(infoCard).queryByLabelText('Type info here')
      ).not.toBeInTheDocument()
    })
  })
})
