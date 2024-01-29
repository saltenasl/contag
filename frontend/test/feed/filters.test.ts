import { ItemType } from 'src/generated/graphql'
import mockGetItems from 'test/requestMocks/getItems'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'

describe('feed filters', () => {
  describe('item type feed', () => {
    it.each([
      ItemType.Message,
      ItemType.Question,
      ItemType.Task,
      ItemType.Info,
    ])('filters by %s item type', async (itemType) => {
      const itemTypeLabel = itemType.toLowerCase()

      const { within, personsFeed, userEvent, person, waitFor } =
        await renderAndNavigateToPersonsFeed()

      const { requestInfo } = mockGetItems({
        items: [],
      })

      const typeFilters = within(personsFeed).getByLabelText('item type filter')
      expect(typeFilters).toBeInTheDocument()
      expect(within(typeFilters).getByLabelText('all')).toHaveAttribute(
        'aria-pressed',
        'true'
      )

      expect(requestInfo.calledTimes).toBe(0)

      const typeFilterButton = within(typeFilters).getByLabelText(itemTypeLabel)
      expect(typeFilterButton).toHaveAttribute('aria-pressed', 'false')

      await userEvent.click(typeFilterButton)

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            parentId: person.id,
            itemType: {
              [itemType.toLowerCase()]: true,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(personsFeed).queryByLabelText('Loading')
        ).not.toBeInTheDocument()
      })

      const allTypesFilterButton = within(typeFilters).getByLabelText('all')
      expect(allTypesFilterButton).toHaveAttribute('aria-pressed', 'false')

      await userEvent.click(allTypesFilterButton)

      expect(requestInfo.calledTimes).toBe(2)
      expect(requestInfo.calls[1].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            parentId: person.id,
            itemType: null,
          },
        })
      )

      await waitFor(() => {
        expect(
          within(personsFeed).queryByLabelText('Loading')
        ).not.toBeInTheDocument()
      })
    })

    it('filters by multiple item types and resets to all', async () => {
      const { within, personsFeed, userEvent, person, waitFor } =
        await renderAndNavigateToPersonsFeed()

      const { requestInfo } = mockGetItems({
        items: [],
      })

      const typeFilters = within(personsFeed).getByLabelText('item type filter')
      expect(typeFilters).toBeInTheDocument()

      const allFilter = within(typeFilters).getByLabelText('all')
      expect(allFilter).toHaveAttribute('aria-pressed', 'true')

      expect(requestInfo.calledTimes).toBe(0)

      const taskTypeFilterButton = within(typeFilters).getByLabelText('task')
      expect(taskTypeFilterButton).toHaveAttribute('aria-pressed', 'false')

      await userEvent.click(taskTypeFilterButton)

      expect(requestInfo.calledTimes).toBe(1)
      expect(requestInfo.calls[0].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            parentId: person.id,
            itemType: {
              task: true,
            },
          },
        })
      )

      await waitFor(() => {
        expect(
          within(personsFeed).queryByLabelText('Loading')
        ).not.toBeInTheDocument()
      })

      const goalTypeFilterButton = within(typeFilters).getByLabelText('goal')
      await userEvent.click(goalTypeFilterButton)

      expect(requestInfo.calledTimes).toBe(2)
      expect(requestInfo.calls[1].requestVariables).toStrictEqual(
        expect.objectContaining({
          filters: {
            parentId: person.id,
            itemType: {
              task: true,
              goal: true,
            },
          },
        })
      )

      expect(taskTypeFilterButton).toHaveAttribute('aria-pressed', 'true')
      expect(goalTypeFilterButton).toHaveAttribute('aria-pressed', 'true')

      await userEvent.click(allFilter)

      expect(requestInfo.calledTimes).toBe(3)
      expect(
        requestInfo.calls[2].requestVariables.filters.itemType
      ).toStrictEqual(null)

      expect(allFilter).toHaveAttribute('aria-pressed', 'true')
      expect(taskTypeFilterButton).toHaveAttribute('aria-pressed', 'false')
      expect(goalTypeFilterButton).toHaveAttribute('aria-pressed', 'false')

      await waitFor(() => {
        expect(
          within(personsFeed).queryByLabelText('Loading')
        ).not.toBeInTheDocument()
      })
    })

    // TODO - wait for Benjamins answers before implementing this (it will require me to create state in ItemTypeFilter hence is not super straightforward)
    it.skip("enables all item types when clicking all after it's already been selected", async () => {
      const { within, personsFeed, userEvent } =
        await renderAndNavigateToPersonsFeed()

      const typeFilters = within(personsFeed).getByLabelText('item type filter')
      expect(typeFilters).toBeInTheDocument()

      const allFilter = within(typeFilters).getByLabelText('all')
      expect(allFilter).toHaveAttribute('aria-pressed', 'true')

      Object.values(ItemType).forEach((itemType) => {
        const label = itemType.toLowerCase()

        expect(within(typeFilters).getByLabelText(label)).toHaveAttribute(
          'aria-pressed',
          'false'
        )
      })

      await userEvent.click(allFilter)

      Object.values(ItemType).forEach((itemType) => {
        const label = itemType.toLowerCase()

        expect(within(typeFilters).getByLabelText(label)).toHaveAttribute(
          'aria-pressed',
          'true'
        )
      })
    })

    describe('action expectation', () => {
      it.each(['todo', 'done', 'not available'])(
        'filters by %s',
        async (filterLabel) => {
          const { within, personsFeed, userEvent, waitFor, person } =
            await renderAndNavigateToPersonsFeed()

          const { requestInfo } = mockGetItems({
            items: [],
          })

          const actionExpectationFilter = within(personsFeed).getByLabelText(
            'action expectation filter'
          )
          expect(actionExpectationFilter).toBeInTheDocument()

          const filter = within(actionExpectationFilter).getByLabelText(
            filterLabel
          )

          expect(filter).toHaveAttribute('aria-pressed', 'false')
          expect(
            within(actionExpectationFilter).getByLabelText('all')
          ).toHaveAttribute('aria-pressed', 'true')

          expect(requestInfo.calledTimes).toBe(0)

          await userEvent.click(filter)

          expect(
            within(actionExpectationFilter).getByLabelText('all')
          ).toHaveAttribute('aria-pressed', 'false')

          expect(requestInfo.calledTimes).toBe(1)
          expect(requestInfo.calls[0].requestVariables).toStrictEqual(
            expect.objectContaining({
              filters: {
                parentId: person.id,
                actionExpectation: {
                  [filterLabel === 'not available' ? 'na' : filterLabel]: true,
                },
              },
            })
          )

          await waitFor(() => {
            expect(
              within(personsFeed).queryByLabelText('Loading')
            ).not.toBeInTheDocument()
          })
        }
      )

      it('filters by multiple statuses and resets to all', async () => {
        const { within, personsFeed, userEvent, waitFor } =
          await renderAndNavigateToPersonsFeed()

        const { requestInfo } = mockGetItems({
          items: [],
        })

        const actionExpectationFilter = within(personsFeed).getByLabelText(
          'action expectation filter'
        )
        expect(actionExpectationFilter).toBeInTheDocument()

        const todoFilter = within(actionExpectationFilter).getByLabelText(
          'todo'
        )
        await userEvent.click(todoFilter)

        expect(requestInfo.calledTimes).toBe(1)

        const naFilter = within(actionExpectationFilter).getByLabelText(
          'not available'
        )
        await userEvent.click(naFilter)

        expect(requestInfo.calledTimes).toBe(2)
        expect(
          requestInfo.calls[1].requestVariables.filters.actionExpectation
        ).toStrictEqual({
          todo: true,
          na: true,
        })

        expect(todoFilter).toHaveAttribute('aria-pressed', 'true')
        expect(naFilter).toHaveAttribute('aria-pressed', 'true')

        // reset to all
        const allFilter = within(actionExpectationFilter).getByLabelText('all')
        expect(allFilter).toHaveAttribute('aria-pressed', 'false')

        await userEvent.click(allFilter)

        expect(requestInfo.calledTimes).toBe(3)
        expect(
          requestInfo.calls[2].requestVariables.filters.actionExpectation
        ).toStrictEqual(null)

        expect(allFilter).toHaveAttribute('aria-pressed', 'true')
        expect(todoFilter).toHaveAttribute('aria-pressed', 'false')
        expect(naFilter).toHaveAttribute('aria-pressed', 'false')

        await waitFor(() => {
          expect(
            within(personsFeed).queryByLabelText('Loading')
          ).not.toBeInTheDocument()
        })
      })
    })
  })
})
