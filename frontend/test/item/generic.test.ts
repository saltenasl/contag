import { faker } from '@faker-js/faker'
import { ActionExpectationType, ItemType } from 'src/generated/graphql'
import itemCardDriver from 'test/drivers/item/card'
import actionExpectationFactory from 'test/factories/actionExpectation'
import goalFactory from 'test/factories/goal'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import mockMutateAmendMessage from 'test/requestMocks/mutateAmendMessage'
import renderItemPage from './utils/renderItemPage'

describe('item page', () => {
  it.each([
    questionFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpected,
      }),
    }),
    taskFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpected,
      }),
    }),
    infoFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpected,
      }),
    }),
    goalFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpected,
      }),
    }),
    questionFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpectedFromYou,
      }),
    }),
    taskFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpectedFromYou,
      }),
    }),
    infoFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpectedFromYou,
      }),
    }),
    goalFactory.build({
      actionExpectation: actionExpectationFactory.build({
        type: ActionExpectationType.ActionExpectedFromYou,
      }),
    }),
  ])('action expectation for %o', async (item) => {
    const { screen, within } = await renderItemPage({
      id: item.id,
    })

    const itemCard = screen.getByTestId(`item-${item.id}`)

    expect(itemCard).toBeInTheDocument()

    if (
      item.actionExpectation?.type == ActionExpectationType.ActionExpected &&
      item.actionExpectation.fulfilled === false
    ) {
      expect(within(itemCard).getByText('Action expected')).toBeInTheDocument()
    }

    if (
      item.actionExpectation?.type ==
        ActionExpectationType.ActionExpectedFromYou &&
      item.actionExpectation.fulfilled === false
    ) {
      expect(
        within(itemCard).getByLabelText('action expectation')
      ).toBeInTheDocument()
    }

    if (item.actionExpectation?.fulfilled === true) {
      expect(
        within(itemCard).queryByLabelText('action expectation')
      ).not.toBeInTheDocument()
    }
  })

  it('editing when there are multiple assignees', async () => {
    const assignees = publicUserFactory.buildList(3)
    const info = infoFactory.build({
      to: assignees,
    })
    mockGetPublicUsers([...assignees, ...info.sharedWith])

    const { container } = await renderItemPage({ id: info.id })

    const cardDriver = itemCardDriver(container, info.id)
    const formDriver = await cardDriver.startEditing()

    expect(formDriver.assignees().getSelectedOptions()).toStrictEqual(
      assignees.map(({ name }) => name)
    )
  })

  it('convert to is hidden while editing', async () => {
    const item = messageFactory.build()
    mockGetPublicUsers(item.sharedWith)
    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    expect(cardDriver.convertTo.isRendered()).toBe(true)
    await cardDriver.startEditing()
    expect(cardDriver.convertTo.isRendered()).toBe(false)
  })

  it('cannot submit edit form twice', async () => {
    // this test is known to raise msw warnings
    const item = messageFactory.build()
    mockGetPublicUsers(item.sharedWith)
    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    mockMutateAmendMessage({ hangForever: true })

    const formDriver = await cardDriver.startEditing()

    await formDriver.updateTextField({
      label: 'Type message here',
      text: faker.lorem.sentence(),
    })

    const editContext = { isEditing: true, itemType: ItemType.Message }
    await formDriver.submit(editContext)

    expect(formDriver.isSubmitRendered(editContext)).toBe(false)
  })
})
