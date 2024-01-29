import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import {
  Goal,
  GoalStatus,
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
import goalFactory from 'test/factories/goal'
import userProfileFactory from 'test/factories/userProfile'
import mockGetChildren from 'test/requestMocks/getChildren'
import mockMutateAmendGoal from 'test/requestMocks/mutateAmendGoal'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderItemPage from './utils/renderItemPage'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import itemFormDriver from 'test/drivers/item/form'
import mockGetSearchItems from 'test/requestMocks/getSearchItems'
import itemCardDriver from 'test/drivers/item/card'
import mockMutateUpdateGoalConstituents from 'test/requestMocks/mutateUpdateGoalConstituents'

describe('goal', () => {
  describe('card', () => {
    it('renders', async () => {
      const goal = goalFactory.build()
      const { container } = await renderItemPage({ id: goal.id })

      const cardDriver = itemCardDriver(container, goal.id)

      expect(cardDriver.text).toBe(goal.text)
      expect(cardDriver.openDetailedView.isRendered()).toBe(false)

      expect(cardDriver.goals.header()).toBe(`Goals (0)`)
    })

    it('child count and child summary', async () => {
      const myProfile = userProfileFactory.build()
      const someUser = publicUserFactory.build()
      const childCount = 1

      const goal = goalFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
        childCount,
      })

      const childInfo = infoFactory.build({ parentId: goal.id })
      const childMessage = messageFactory.build({ parentId: goal.id })
      const childQuestion = questionFactory.build({ parentId: goal.id })
      const childGoal = goalFactory.build({
        parentId: goal.id,
        to: [userToPublicUser(myProfile)],
      })
      const summarizedChild = messageFactory.build({
        parentId: goal.id,
        summary: summaryFactory.build(),
      })
      const actionExpectedChild = messageFactory.build({
        parentId: goal.id,
      })

      const children = [
        childInfo,
        childMessage,
        childQuestion,
        childGoal,
        summarizedChild,
        actionExpectedChild,
      ]

      const { within, userEvent, screen, waitFor } = await renderItemPage({
        id: goal.id,
        myProfile,
      })
      const { requestInfo } = mockGetChildren()

      const messageCard = screen.getByTestId(`item-${goal.id}`)
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
          filters: expect.objectContaining({ parentId: goal.id }),
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

        const text = childItem.text
        expect(
          within(childSummary).getByText(
            text.length > 200 ? text.substr(0, 200) + '...' : text
          )
        ).toBeInTheDocument()

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

  describe('constituents', () => {
    it('edits constituents', async () => {
      const existingConstituent = goalFactory.build()
      const toBeAddedConstituent = goalFactory.build()
      const goal = goalFactory.build({ constituents: [existingConstituent] })
      const searchTerm = 'a'
      const { requestInfo: searchRequestInfo } = mockGetSearchItems({
        items: [existingConstituent, toBeAddedConstituent],
      })
      const { requestInfo: updateConstituentsRequestInfo } =
        mockMutateUpdateGoalConstituents()

      const { container } = await renderItemPage({
        id: goal.id,
      })

      const cardDriver = itemCardDriver(container, goal.id)

      expect(cardDriver.constituents.isStopEditingVisible()).toBe(false)
      expect(cardDriver.constituents.isStartEditingVisible()).toBe(true)

      const constituentsDriver = await cardDriver.constituents.startEditing()

      expect(cardDriver.constituents.isStopEditingVisible()).toBe(true)
      expect(cardDriver.constituents.isStartEditingVisible()).toBe(false)
      expect(constituentsDriver.getSelectedOptions()).toStrictEqual([
        existingConstituent.text,
      ])

      constituentsDriver.options.isNotRendered()
      await constituentsDriver.options.open()
      expect(constituentsDriver.hasZeroOptions()).toBe(true)

      expect(searchRequestInfo.calledTimes).toBe(0)

      await constituentsDriver.search(searchTerm)

      expect(searchRequestInfo.calledTimes).toBe(1)
      expect(searchRequestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            itemType: null,
            search: searchTerm,
          },
        })
      )

      await constituentsDriver.options.waitForOptionsToLoad()

      expect(constituentsDriver.options.list()).toStrictEqual(
        expect.arrayContaining([
          existingConstituent.text,
          toBeAddedConstituent.text,
        ])
      )
      expect(constituentsDriver.options.list()).toHaveLength(2)
      expect(
        constituentsDriver.isOptionSelected(existingConstituent.text)
      ).toBe(true)
      expect(
        constituentsDriver.isOptionSelected(toBeAddedConstituent.text)
      ).toBe(false)

      await constituentsDriver.options.toggleOption(existingConstituent.text)
      await constituentsDriver.options.toggleOption(toBeAddedConstituent.text)

      await constituentsDriver.save()

      expect(updateConstituentsRequestInfo.calledTimes).toBe(1)
      expect(
        updateConstituentsRequestInfo.calls[0].requestVariables
      ).toStrictEqual({
        itemId: goal.id,
        constituentsAdded: [{ id: toBeAddedConstituent.id }],
        constituentsRemoved: [{ id: existingConstituent.id }],
      })
    })

    it('click on constituent redirects to its detailed page', async () => {
      const constituent = goalFactory.build()
      const item = goalFactory.build({ constituents: [constituent] })

      const { container, getLocation } = await renderItemPage({
        id: item.id,
      })

      const cardDriver = itemCardDriver(container, item.id)

      await cardDriver.constituents.constituent(constituent.id).click()

      expect(getLocation().pathname).toBe(`/item/${constituent.id}`)
    })
  })

  describe('updating goals status', () => {
    it('toggles goal status', async () => {
      const myProfile = userProfileFactory.build()
      const goal = goalFactory.build({
        author: userToPublicUser(myProfile),
        goalStatus: GoalStatus.Todo,
      })

      const { screen, waitFor, userEvent, within } = await renderItemPage({
        id: goal.id,
        myProfile,
      })

      const goalCard = screen.getByTestId(`item-${goal.id}`)

      expect(within(goalCard).getByText(goal.text)).toBeInTheDocument()

      const convertToDoneButton = within(goalCard).getByText(
        `Mark as ${GoalStatus.Done}`
      )
      expect(convertToDoneButton).toBeInTheDocument()

      const { requestInfo } = mockMutateAmendGoal()

      expect(
        within(goalCard).getByText(`Status: ${GoalStatus.Todo}`)
      ).toBeInTheDocument()

      await userEvent.click(convertToDoneButton)

      expect(requestInfo.calledTimes).toBe(1)

      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: goal.id,
              goalStatus: GoalStatus.Done,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(goalCard).getByText(`Status: ${GoalStatus.Done}`)
        ).toBeInTheDocument()
      })

      const convertToToDoButton = await waitFor(() => {
        const convertToToDoButton = within(goalCard).getByText(
          `Mark as ${GoalStatus.Todo}`
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
              id: goal.id,
              goalStatus: GoalStatus.Todo,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(goalCard).getByText(`Status: ${GoalStatus.Todo}`)
        ).toBeInTheDocument()
      })
    })
  })

  describe('edit', () => {
    const renderAndOpenGoalEdit = async (
      additionalGoalProps: Partial<Goal> = {},
      {
        myProfile = userProfileFactory.build(),
        publicUsers = [],
      }: {
        myProfile?: ReturnType<typeof userProfileFactory.build>
        publicUsers?: PublicUser[]
      } = {}
    ) => {
      const goal = goalFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile)],
        ...additionalGoalProps,
      })

      mockGetPublicUsers(publicUsers)

      const { within, screen, userEvent, waitFor } = await renderItemPage({
        id: goal.id,
        myProfile,
      })

      const goalCard = screen.getByTestId(`item-${goal.id}`)

      expect(within(goalCard).getByLabelText('edit')).toBeInTheDocument()

      await userEvent.click(within(goalCard).getByLabelText('edit'))

      expect(within(goalCard).queryByLabelText('edit')).not.toBeInTheDocument()

      return { within, goalCard, goal, userEvent, myProfile, waitFor }
    }

    it('edits a goal', async () => {
      const { requestInfo } = mockMutateAmendGoal()
      const { within, goalCard, goal, userEvent, waitFor, myProfile } =
        await renderAndOpenGoalEdit()

      expect(
        within(goalCard).queryByText(`Mark as ${GoalStatus.Done}`)
      ).not.toBeInTheDocument()

      const goalInput = within(goalCard).getByLabelText('Type goal title here')
      expect(goalInput).toBeInTheDocument()
      expect(goalInput).toHaveValue(goal.text)

      expect(
        within(goalCard).queryByLabelText('convert to goal')
      ).not.toBeInTheDocument()
      expect(within(goalCard).getByLabelText('submit edit')).toBeInTheDocument()
      expect(
        within(goalCard).getByLabelText('stop editing')
      ).toBeInTheDocument()

      const text = faker.lorem.sentence()
      await userEvent.clear(goalInput)
      await userEvent.type(goalInput, text, { skipClick: true })
      expect(goalInput).toHaveValue(text)

      await userEvent.click(within(goalCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0]).toStrictEqual(
        expect.objectContaining({
          requestVariables: {
            input: {
              id: goal.id,
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
          within(goalCard).queryByLabelText('Type goal title here')
        ).not.toBeInTheDocument()
      })
      expect(within(goalCard).getByText(text)).toBeInTheDocument()
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

      const { within, goalCard, userEvent, waitFor } =
        await renderAndOpenGoalEdit(
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
      const { requestInfo } = mockMutateAmendGoal()

      expect(requestInfo.calledTimes).toBe(0)

      const completeUntilInput =
        within(goalCard).getByLabelText('Complete until')

      expect(completeUntilInput).toBeInTheDocument()
      expect(completeUntilInput).toHaveValue(completeUntilInitialDateTimeString)

      const completeUntilDateTimeString = dayjs(dateForReference)
        .add(2, 'hour')
        .format(DATE_TIME_PICKER_INPUT_FORMAT)

      await userEvent.clear(completeUntilInput)
      await userEvent.type(completeUntilInput, completeUntilDateTimeString)
      expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

      const formDriver = itemFormDriver(goalCard)

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

      await userEvent.click(within(goalCard).getByLabelText('submit edit'))

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
          within(goalCard).getByLabelText('action expectation')
        ).toHaveTextContent(
          `Action expected by by ${completeUntilDateTimeString}`
        )
      })
      newAssignees.forEach((assignee) => {
        expect(
          within(
            within(goalCard).getByLabelText('action expectation')
          ).getByLabelText(`${assignee.name} avatar`)
        ).toBeInTheDocument()
      })
    })

    it('edits attachments', async () => {
      const existingAttachment = fileFactory.build()
      const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()
      const { requestInfo } = mockMutateAmendGoal()
      const { within, userEvent, goalCard, waitFor } =
        await renderAndOpenGoalEdit({
          attachments: [existingAttachment],
        })

      const existingAttachmentElement = within(goalCard).getByText(
        existingAttachment.originalName
      )
      expect(existingAttachmentElement).toBeInTheDocument()

      await userEvent.click(
        within(goalCard).getByLabelText(
          `delete ${existingAttachment.originalName}`
        )
      )
      expect(existingAttachmentElement).not.toBeInTheDocument()

      const { originalName, contentType } = fileFactory.build()
      const file = new File([''], originalName, { type: contentType })

      await userEvent.upload(
        within(goalCard).getByLabelText('upload attachment'),
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
          within(goalCard).queryByLabelText('uploading')
        ).not.toBeInTheDocument()
      })

      const addedAttachment = createFileRequestInfo.calls[0].responseData
        .createFile as GraphQLFile

      await userEvent.click(within(goalCard).getByLabelText('submit edit'))

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual({
        input: expect.objectContaining({
          attachments: [{ id: addedAttachment.id }],
        }),
      })

      await waitFor(() => {
        expect(
          within(goalCard).queryByLabelText('submit edit')
        ).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          within(goalCard).queryByText(existingAttachment.originalName)
        ).not.toBeInTheDocument()
      })
      expect(
        within(goalCard).getByText(addedAttachment.originalName)
      ).toBeInTheDocument()
    })

    it('edits shared with', async () => {
      const myProfile = userProfileFactory.build()
      const otherUser = userProfileFactory.build()
      const { requestInfo } = mockMutateAmendGoal()

      const { goalCard, within, waitFor } = await renderAndOpenGoalEdit(
        {},
        {
          myProfile,
          publicUsers: [
            userToPublicUser(myProfile),
            userToPublicUser(otherUser),
          ],
        }
      )

      const formDriver = itemFormDriver(goalCard)
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
        itemType: ItemType.Goal,
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

      const sharedWith = within(goalCard).getByLabelText('shared with')
      expect(
        within(sharedWith).getByLabelText(`${otherUser.name} avatar`)
      ).toBeInTheDocument()
    })

    it('stop editing button resets the card to the default', async () => {
      const { within, goalCard, userEvent } = await renderAndOpenGoalEdit()

      const stopEditingButton = within(goalCard).getByLabelText('stop editing')
      expect(stopEditingButton).toBeInTheDocument()
      expect(
        within(goalCard).getByLabelText('Type goal title here')
      ).toBeInTheDocument()

      await userEvent.click(stopEditingButton)

      expect(
        within(goalCard).queryByLabelText('Type goal title here')
      ).not.toBeInTheDocument()
    })

    it('escape stops editing', async () => {
      const { within, goalCard, userEvent } = await renderAndOpenGoalEdit()

      expect(
        within(goalCard).getByLabelText('Type goal title here')
      ).toHaveFocus()

      await userEvent.keyboard('{Escape}')

      expect(
        within(goalCard).queryByLabelText('Type goal title here')
      ).not.toBeInTheDocument()
    })
  })
})
