import { Item } from 'src/types'
import itemCardDriver from 'test/drivers/item/card'
import goalFactory from 'test/factories/goal'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import mockGetSearchItems from 'test/requestMocks/getSearchItems'
import mockMutateUpdateItemGoals from 'test/requestMocks/mutateUpdateItemGoals'
import renderItemPage from './utils/renderItemPage'

describe('item goals', () => {
  it.each`
    itemFactory        | type
    ${messageFactory}  | ${'message'}
    ${infoFactory}     | ${'info'}
    ${questionFactory} | ${'question'}
    ${taskFactory}     | ${'task'}
    ${goalFactory}     | ${'goal'}
  `('goals on $type', async ({ itemFactory }) => {
    const goals = [goalFactory.build()]
    const item = itemFactory.build({ goals }) as Item

    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    expect(cardDriver.goals.header()).toBe(`Goals (${goals.length})`)
  })

  it('clicking on goal redirects to goals detailed page', async () => {
    const goal = goalFactory.build()
    const item = goalFactory.build({ goals: [goal] })

    const { container, getLocation } = await renderItemPage({
      id: item.id,
    })

    const cardDriver = itemCardDriver(container, item.id)

    await cardDriver.goals.goal(goal.id).click()

    expect(getLocation().pathname).toBe(`/item/${goal.id}`)
  })

  describe('only checks one type because this test is expensive, the component is reusable and the "goals on $type" test guarantees it\'s being used', () => {
    it('edits goals', async () => {
      const existingGoal = goalFactory.build()
      const toBeAddedGoal = goalFactory.build()
      const goals = [existingGoal]
      const item = goalFactory.build({
        goals,
      })
      const searchTerm = 'a'
      const { requestInfo: searchRequestInfo } = mockGetSearchItems({
        items: [existingGoal, toBeAddedGoal],
      })
      const { requestInfo: updateConstituentsRequestInfo } =
        mockMutateUpdateItemGoals()

      const { container } = await renderItemPage({
        id: item.id,
      })

      const cardDriver = itemCardDriver(container, item.id)

      expect(cardDriver.goals.isStopEditingVisible()).toBe(false)
      expect(cardDriver.goals.isStartEditingVisible()).toBe(true)

      const goalsDriver = await cardDriver.goals.startEditing()

      expect(cardDriver.goals.isStopEditingVisible()).toBe(true)
      expect(cardDriver.goals.isStartEditingVisible()).toBe(false)
      expect(goalsDriver.getSelectedOptions()).toStrictEqual([
        existingGoal.text,
      ])

      goalsDriver.options.isNotRendered()
      await goalsDriver.options.open()
      expect(goalsDriver.hasZeroOptions()).toBe(true)

      expect(searchRequestInfo.calledTimes).toBe(0)

      await goalsDriver.search(searchTerm)

      expect(searchRequestInfo.calledTimes).toBe(1)
      expect(searchRequestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            search: searchTerm,
            itemType: {
              goal: true,
            },
          },
        })
      )

      await goalsDriver.options.waitForOptionsToLoad()

      expect(goalsDriver.options.list()).toStrictEqual(
        expect.arrayContaining([existingGoal.text, toBeAddedGoal.text])
      )
      expect(goalsDriver.options.list()).toHaveLength(2)
      expect(goalsDriver.isOptionSelected(existingGoal.text)).toBe(true)
      expect(goalsDriver.isOptionSelected(toBeAddedGoal.text)).toBe(false)

      await goalsDriver.options.toggleOption(existingGoal.text)
      await goalsDriver.options.toggleOption(toBeAddedGoal.text)

      await goalsDriver.save()

      expect(updateConstituentsRequestInfo.calledTimes).toBe(1)
      expect(
        updateConstituentsRequestInfo.calls[0].requestVariables
      ).toStrictEqual({
        itemId: item.id,
        goalsAdded: [{ id: toBeAddedGoal.id }],
        goalsRemoved: [{ id: existingGoal.id }],
      })
    })
  })
})
