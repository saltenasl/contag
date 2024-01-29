import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import {
  Task,
  TaskStatus,
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
import mockMutateAmendTask from 'test/requestMocks/mutateAmendTask'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderItemPage from './utils/renderItemPage'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import itemFormDriver from 'test/drivers/item/form'
import itemCardDriver from 'test/drivers/item/card'

describe('task', () => {
  describe('card', () => {
    it('renders', async () => {
      const task = taskFactory.build()
      const { container } = await renderItemPage({ id: task.id })

      const cardDriver = itemCardDriver(container, task.id)

      expect(cardDriver.text).toBe(task.text)
      expect(cardDriver.openDetailedView.isRendered()).toBe(false)

      expect(cardDriver.goals.header()).toBe(`Goals (0)`)
    })

    it('child count and child summary', async () => {
      const myProfile = userProfileFactory.build()
      const someUser = publicUserFactory.build()
      const childCount = 1

      const task = taskFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        childCount,
      })

      const childInfo = infoFactory.build({ parentId: task.id })
      const childMessage = messageFactory.build({ parentId: task.id })
      const childQuestion = questionFactory.build({ parentId: task.id })
      const childTask = taskFactory.build({
        parentId: task.id,
        to: [userToPublicUser(myProfile)],
      })
      const summarizedChild = messageFactory.build({
        parentId: task.id,
        summary: summaryFactory.build(),
      })
      const actionExpectedChild = messageFactory.build({
        parentId: task.id,
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
        id: task.id,
        myProfile,
      })
      const { requestInfo } = mockGetChildren()

      const messageCard = screen.getByTestId(`item-${task.id}`)
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
          filters: expect.objectContaining({ parentId: task.id }),
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

  describe('updating tasks status', () => {
    it('toggles task status', async () => {
      const myProfile = userProfileFactory.build()
      const task = taskFactory.build({
        author: userToPublicUser(myProfile),
        status: TaskStatus.Todo,
      })

      const { screen, waitFor, userEvent, within } = await renderItemPage({
        id: task.id,
        myProfile,
      })

      const taskCard = screen.getByTestId(`item-${task.id}`)

      expect(within(taskCard).getByText(task.text)).toBeInTheDocument()

      const convertToDoneButton = within(taskCard).getByText(
        `Mark as ${TaskStatus.Done}`
      )
      expect(convertToDoneButton).toBeInTheDocument()

      const { requestInfo } = mockMutateAmendTask()

      expect(
        within(taskCard).getByText(`Status: ${TaskStatus.Todo}`)
      ).toBeInTheDocument()

      await userEvent.click(convertToDoneButton)

      expect(requestInfo.calledTimes).toBe(1)

      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: task.id,
              status: TaskStatus.Done,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(taskCard).getByText(`Status: ${TaskStatus.Done}`)
        ).toBeInTheDocument()
      })

      const convertToToDoButton = await waitFor(() => {
        const convertToToDoButton = within(taskCard).getByText(
          `Mark as ${TaskStatus.Todo}`
        )
        expect(convertToToDoButton).toBeInTheDocument()

        return convertToToDoButton
      })

      await userEvent.click(convertToToDoButton)

      expect(requestInfo.calledTimes).toBe(2)

      expect(requestInfo.calls[1]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: task.id,
              status: TaskStatus.Todo,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(taskCard).getByText(`Status: ${TaskStatus.Todo}`)
        ).toBeInTheDocument()
      })
    })
  })

  describe('edit', () => {
    const renderAndOpenTaskEdit = async (
      additionalTaskProps: Partial<Task> = {},
      {
        myProfile = userProfileFactory.build(),
        publicUsers = [],
      }: {
        myProfile?: ReturnType<typeof userProfileFactory.build>
        publicUsers?: PublicUser[]
      } = {}
    ) => {
      const task = taskFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile)],
        ...additionalTaskProps,
      })

      mockGetPublicUsers(publicUsers)

      const { within, screen, userEvent, waitFor } = await renderItemPage({
        id: task.id,
        myProfile,
      })

      const taskCard = screen.getByTestId(`item-${task.id}`)

      expect(within(taskCard).getByLabelText('edit')).toBeInTheDocument()

      await userEvent.click(within(taskCard).getByLabelText('edit'))

      expect(within(taskCard).queryByLabelText('edit')).not.toBeInTheDocument()

      return { within, taskCard, task, userEvent, myProfile, waitFor }
    }

    it('edits a task', async () => {
      const { requestInfo } = mockMutateAmendTask()
      const { within, taskCard, task, userEvent, waitFor, myProfile } =
        await renderAndOpenTaskEdit()

      expect(
        within(taskCard).queryByText(`Mark as ${TaskStatus.Done}`)
      ).not.toBeInTheDocument()

      const taskInput = within(taskCard).getByLabelText(
        'Type task description here'
      )
      expect(taskInput).toBeInTheDocument()
      expect(taskInput).toHaveValue(task.text)

      expect(
        within(taskCard).queryByLabelText('convert to task')
      ).not.toBeInTheDocument()
      expect(within(taskCard).getByLabelText('submit edit')).toBeInTheDocument()
      expect(
        within(taskCard).getByLabelText('stop editing')
      ).toBeInTheDocument()

      const description = faker.lorem.sentence()
      await userEvent.clear(
        within(taskCard).getByLabelText('Type task description here')
      )
      await userEvent.type(
        within(taskCard).getByLabelText('Type task description here'),
        description,
        { skipClick: true }
      )
      expect(
        within(taskCard).getByLabelText('Type task description here')
      ).toHaveValue(description)

      await userEvent.click(within(taskCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: task.id,
              text: description,
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
          within(taskCard).queryByLabelText('Type task description here')
        ).not.toBeInTheDocument()
      })
      expect(within(taskCard).getByText(description)).toBeInTheDocument()
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

      const { within, taskCard, userEvent, waitFor } =
        await renderAndOpenTaskEdit(
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
      const { requestInfo } = mockMutateAmendTask()

      expect(requestInfo.calledTimes).toBe(0)

      const completeUntilInput =
        within(taskCard).getByLabelText('Complete until')

      expect(completeUntilInput).toBeInTheDocument()
      expect(completeUntilInput).toHaveValue(completeUntilInitialDateTimeString)

      const completeUntilDateTimeString = dayjs(dateForReference)
        .add(2, 'hour')
        .format(DATE_TIME_PICKER_INPUT_FORMAT)

      await userEvent.clear(completeUntilInput)
      await userEvent.type(completeUntilInput, completeUntilDateTimeString)
      expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

      const formDriver = itemFormDriver(taskCard)

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

      await userEvent.click(within(taskCard).getByLabelText('submit edit'))

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
          within(taskCard).getByLabelText('action expectation')
        ).toHaveTextContent(
          `Action expected by by ${completeUntilDateTimeString}`
        )
      })
      newAssignees.forEach((assignee) => {
        expect(
          within(
            within(taskCard).getByLabelText('action expectation')
          ).getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })

    it('edits attachments', async () => {
      const existingAttachment = fileFactory.build()
      const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()
      const { requestInfo } = mockMutateAmendTask()
      const { within, userEvent, taskCard, waitFor } =
        await renderAndOpenTaskEdit({
          attachments: [existingAttachment],
        })

      const existingAttachmentElement = within(taskCard).getByText(
        existingAttachment.originalName
      )
      expect(existingAttachmentElement).toBeInTheDocument()

      await userEvent.click(
        within(taskCard).getByLabelText(
          `delete ${existingAttachment.originalName}`
        )
      )
      expect(existingAttachmentElement).not.toBeInTheDocument()

      const { originalName, contentType } = fileFactory.build()
      const file = new File([''], originalName, { type: contentType })

      await userEvent.upload(
        within(taskCard).getByLabelText('upload attachment'),
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
          within(taskCard).queryByLabelText('uploading')
        ).not.toBeInTheDocument()
      })

      const addedAttachment = createFileRequestInfo.calls[0].responseData
        .createFile as GraphQLFile

      await userEvent.click(within(taskCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          attachments: [{ id: addedAttachment.id }],
        }),
      })

      await waitFor(() => {
        expect(
          within(taskCard).queryByLabelText('submit edit')
        ).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(taskCard).queryByText(existingAttachment.originalName)
        ).not.toBeInTheDocument()
      })
      expect(
        within(taskCard).getByText(addedAttachment.originalName)
      ).toBeInTheDocument()
    })

    it('edits shared with', async () => {
      const myProfile = userProfileFactory.build()
      const otherUser = userProfileFactory.build()
      const { requestInfo } = mockMutateAmendTask()

      const { taskCard, within, waitFor } = await renderAndOpenTaskEdit(
        {},
        {
          myProfile,
          publicUsers: [
            userToPublicUser(myProfile),
            userToPublicUser(otherUser),
          ],
        }
      )

      const formDriver = itemFormDriver(taskCard)
      const sharedWithDriver = formDriver.sharedWith()

      expect(sharedWithDriver.getSelectedOptions()).toStrictEqual([
        myProfile.name,
      ])

      sharedWithDriver.options.isNotRendered()
      await sharedWithDriver.options.open()
      sharedWithDriver.options.isRendered()

      sharedWithDriver.options.toggleOption(otherUser.name)

      await formDriver.submit({
        isEditing: true,
        itemType: ItemType.Task,
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

      const sharedWith = within(taskCard).getByLabelText('shared with')
      expect(
        within(sharedWith).getByLabelText(`${otherUser.name} avatar`)
      ).toBeInTheDocument()
    })

    it('stop editing button resets the card to the default', async () => {
      const { within, taskCard, userEvent } = await renderAndOpenTaskEdit()

      const stopEditingButton = within(taskCard).getByLabelText('stop editing')
      expect(stopEditingButton).toBeInTheDocument()
      expect(
        within(taskCard).getByLabelText('Type task description here')
      ).toBeInTheDocument()

      await userEvent.click(stopEditingButton)

      expect(
        within(taskCard).queryByLabelText('Type task description here')
      ).not.toBeInTheDocument()
    })

    it('escape stops editing', async () => {
      const { within, taskCard, userEvent } = await renderAndOpenTaskEdit()

      expect(
        within(taskCard).getByLabelText('Type task description here')
      ).toHaveFocus()

      await userEvent.keyboard('{Escape}')

      expect(
        within(taskCard).queryByLabelText('Type task description here')
      ).not.toBeInTheDocument()
    })
  })
})
