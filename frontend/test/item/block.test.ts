import { Item } from 'src/generated/graphql'
import itemCardDriver from 'test/drivers/item/card'
import goalFactory from 'test/factories/goal'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import mockGetSearchItems from 'test/requestMocks/getSearchItems'
import mockMutateUpdateItemIsBlockedBy from 'test/requestMocks/mutateUpdateItemIsBlockedBy'
import mockMutateUpdateItemsBlocked from 'test/requestMocks/mutateUpdateItemsBlocked'
import renderItemPage from './utils/renderItemPage'

it.each`
  itemFactory        | type
  ${messageFactory}  | ${'message'}
  ${infoFactory}     | ${'info'}
  ${questionFactory} | ${'question'}
  ${taskFactory}     | ${'task'}
  ${goalFactory}     | ${'goal'}
`(
  'shows blocks/blocked for $type by when there are 0 items that item blocks/is blocked by',
  async ({ itemFactory }) => {
    const item = itemFactory.build() as Item

    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    expect(cardDriver.blockedItems.header()).toBe(`Blocks (0)`)
    expect(cardDriver.blockedBy.header()).toBe(`Blocked by (0)`)
  }
)

describe('blocked items', () => {
  it.each`
    itemFactory        | type
    ${messageFactory}  | ${'message'}
    ${infoFactory}     | ${'info'}
    ${questionFactory} | ${'question'}
    ${taskFactory}     | ${'task'}
    ${goalFactory}     | ${'goal'}
  `('blocked items on $type', async ({ itemFactory }) => {
    const blocks = [taskFactory.build()]
    const item = itemFactory.build({ blocks }) as Item

    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    expect(cardDriver.blockedItems.header()).toBe(`Blocks (${blocks.length})`)
  })

  it('clicking on blocked item redirects to its detailed page', async () => {
    const blockedItem = taskFactory.build()
    const item = taskFactory.build({ blocks: [blockedItem] })

    const { container, getLocation } = await renderItemPage({
      id: item.id,
    })

    const cardDriver = itemCardDriver(container, item.id)

    await cardDriver.blockedItems.item(blockedItem.id).click()

    expect(getLocation().pathname).toBe(`/item/${blockedItem.id}`)
  })

  describe('only checks one type because this test is expensive, the component is reusable and the "blocked items on $type" test guarantees it\'s being used', () => {
    it('edits blocked items', async () => {
      const currentlyBlockedItem = taskFactory.build()
      const toBeBlockedItem = taskFactory.build()
      const item = taskFactory.build({
        blocks: [currentlyBlockedItem],
      })
      const searchTerm = 'a'
      const { requestInfo: searchRequestInfo } = mockGetSearchItems({
        items: [currentlyBlockedItem, toBeBlockedItem],
      })
      const { requestInfo: updateItemsBlockedRequestInfo } =
        mockMutateUpdateItemsBlocked()

      const { container } = await renderItemPage({
        id: item.id,
      })

      const cardDriver = itemCardDriver(container, item.id)

      expect(cardDriver.blockedItems.isStopEditingVisible()).toBe(false)
      expect(cardDriver.blockedItems.isStartEditingVisible()).toBe(true)

      const blockedItemsDriver = await cardDriver.blockedItems.startEditing()

      expect(cardDriver.blockedItems.isStopEditingVisible()).toBe(true)
      expect(cardDriver.blockedItems.isStartEditingVisible()).toBe(false)
      expect(blockedItemsDriver.getSelectedOptions()).toStrictEqual([
        currentlyBlockedItem.text,
      ])

      blockedItemsDriver.options.isNotRendered()
      await blockedItemsDriver.options.open()
      expect(blockedItemsDriver.hasZeroOptions()).toBe(true)

      expect(searchRequestInfo.calledTimes).toBe(0)

      await blockedItemsDriver.search(searchTerm)

      expect(searchRequestInfo.calledTimes).toBe(1)
      expect(searchRequestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            search: searchTerm,
            itemType: null,
          },
        })
      )

      await blockedItemsDriver.options.waitForOptionsToLoad()

      expect(blockedItemsDriver.options.list()).toStrictEqual(
        expect.arrayContaining([
          currentlyBlockedItem.text,
          toBeBlockedItem.text,
        ])
      )
      expect(blockedItemsDriver.options.list()).toHaveLength(2)
      expect(
        blockedItemsDriver.isOptionSelected(currentlyBlockedItem.text)
      ).toBe(true)
      expect(blockedItemsDriver.isOptionSelected(toBeBlockedItem.text)).toBe(
        false
      )

      await blockedItemsDriver.options.toggleOption(currentlyBlockedItem.text)
      await blockedItemsDriver.options.toggleOption(toBeBlockedItem.text)

      await blockedItemsDriver.save()

      expect(updateItemsBlockedRequestInfo.calledTimes).toBe(1)
      expect(
        updateItemsBlockedRequestInfo.calls[0].requestVariables
      ).toStrictEqual({
        itemId: item.id,
        itemsBlockedAdded: [{ id: toBeBlockedItem.id }],
        itemsBlockedRemoved: [{ id: currentlyBlockedItem.id }],
      })
    })
  })
})

describe('item is blocked by', () => {
  it.each`
    itemFactory        | type
    ${messageFactory}  | ${'message'}
    ${infoFactory}     | ${'info'}
    ${questionFactory} | ${'question'}
    ${taskFactory}     | ${'task'}
    ${goalFactory}     | ${'goal'}
  `('blocked by items on $type', async ({ itemFactory }) => {
    const blockedBy = [taskFactory.build()]
    const item = itemFactory.build({ blockedBy }) as Item

    const { container } = await renderItemPage({ id: item.id })

    const cardDriver = itemCardDriver(container, item.id)

    expect(cardDriver.blockedBy.header()).toBe(
      `Blocked by (${blockedBy.length})`
    )
  })

  it('clicking on blocked by item redirects to its detailed page', async () => {
    const blockedByItem = taskFactory.build()
    const item = taskFactory.build({ blockedBy: [blockedByItem] })

    const { container, getLocation } = await renderItemPage({
      id: item.id,
    })

    const cardDriver = itemCardDriver(container, item.id)

    await cardDriver.blockedBy.item(blockedByItem.id).click()

    expect(getLocation().pathname).toBe(`/item/${blockedByItem.id}`)
  })

  describe('only checks one type because this test is expensive, the component is reusable and the "blocked items on $type" test guarantees it\'s being used', () => {
    it('edits blocked items', async () => {
      const currentlyBlockedByItem = taskFactory.build()
      const toBeBlockedByItem = taskFactory.build()
      const item = taskFactory.build({
        blockedBy: [currentlyBlockedByItem],
      })
      const searchTerm = 'a'
      const { requestInfo: searchRequestInfo } = mockGetSearchItems({
        items: [currentlyBlockedByItem, toBeBlockedByItem],
      })
      const { requestInfo: updateItemsBlockedRequestInfo } =
        mockMutateUpdateItemIsBlockedBy()

      const { container } = await renderItemPage({
        id: item.id,
      })

      const cardDriver = itemCardDriver(container, item.id)

      expect(cardDriver.blockedBy.isStopEditingVisible()).toBe(false)
      expect(cardDriver.blockedBy.isStartEditingVisible()).toBe(true)

      const blockedByDriver = await cardDriver.blockedBy.startEditing()

      expect(cardDriver.blockedBy.isStopEditingVisible()).toBe(true)
      expect(cardDriver.blockedBy.isStartEditingVisible()).toBe(false)
      expect(blockedByDriver.getSelectedOptions()).toStrictEqual([
        currentlyBlockedByItem.text,
      ])

      blockedByDriver.options.isNotRendered()
      await blockedByDriver.options.open()
      expect(blockedByDriver.hasZeroOptions()).toBe(true)

      expect(searchRequestInfo.calledTimes).toBe(0)

      await blockedByDriver.search(searchTerm)

      expect(searchRequestInfo.calledTimes).toBe(1)
      expect(searchRequestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            search: searchTerm,
            itemType: null,
          },
        })
      )

      await blockedByDriver.options.waitForOptionsToLoad()

      expect(blockedByDriver.options.list()).toStrictEqual(
        expect.arrayContaining([
          currentlyBlockedByItem.text,
          toBeBlockedByItem.text,
        ])
      )
      expect(blockedByDriver.options.list()).toHaveLength(2)
      expect(
        blockedByDriver.isOptionSelected(currentlyBlockedByItem.text)
      ).toBe(true)
      expect(blockedByDriver.isOptionSelected(toBeBlockedByItem.text)).toBe(
        false
      )

      await blockedByDriver.options.toggleOption(currentlyBlockedByItem.text)
      await blockedByDriver.options.toggleOption(toBeBlockedByItem.text)

      await blockedByDriver.save()

      expect(updateItemsBlockedRequestInfo.calledTimes).toBe(1)
      expect(
        updateItemsBlockedRequestInfo.calls[0].requestVariables
      ).toStrictEqual({
        itemId: item.id,
        blockedByAdded: [{ id: toBeBlockedByItem.id }],
        blockedByRemoved: [{ id: currentlyBlockedByItem.id }],
      })
    })
  })
})
