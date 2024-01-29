import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import autocompleteFieldDriver from './fields/autocomplete'
import itemFormDriver from './form'

const itemCardDriver = (parentElement: HTMLElement, itemId: string) => {
  const itemCard = within(parentElement).getByTestId(`item-${itemId}`)

  return {
    startEditing: async () => {
      await userEvent.click(within(itemCard).getByLabelText('edit'))

      return itemFormDriver(itemCard)
    },
    constituents: {
      startEditing: async () => {
        await userEvent.click(
          within(itemCard).getByLabelText('edit constituents')
        )

        return {
          ...autocompleteFieldDriver({
            formElement: itemCard,
            id: 'goal-constituents',
            input: { placeholder: 'Type to search' },
            chip: { label: 'goal constituent' },
          }),
          save: async () => {
            await userEvent.click(
              within(itemCard).getByText('Save constituents')
            )
          },
        }
      },
      constituent: (id: string) => {
        const constituentElement = within(itemCard).getByTestId(
          `constituent-${id}`
        )

        return {
          click: async () => {
            await userEvent.click(constituentElement)
          },
        }
      },
      isStopEditingVisible: () => {
        const stopEditingElement = within(itemCard).queryByLabelText(
          'stop editing constituents'
        )

        return stopEditingElement !== null
      },
      isStartEditingVisible: () => {
        const startEditingElement =
          within(itemCard).queryByLabelText('edit constituents')

        return startEditingElement !== null
      },
    },

    goals: {
      startEditing: async () => {
        await userEvent.click(within(itemCard).getByLabelText('edit goals'))

        return {
          ...autocompleteFieldDriver({
            formElement: itemCard,
            id: 'item-goals',
            input: { placeholder: 'Type to search' },
            chip: { label: 'item goal' },
          }),
          save: async () => {
            await userEvent.click(within(itemCard).getByText('Save goals'))
          },
        }
      },
      goal: (id: string) => {
        const goalElement = within(itemCard).getByTestId(`goal-${id}`)

        return {
          click: async () => {
            await userEvent.click(goalElement)
          },
        }
      },
      header: () => {
        return within(itemCard).getByTestId('goals-header').textContent
      },
      isStopEditingVisible: () => {
        const stopEditingElement =
          within(itemCard).queryByLabelText('stop editing goals')

        return stopEditingElement !== null
      },
      isStartEditingVisible: () => {
        const startEditingElement =
          within(itemCard).queryByLabelText('edit goals')

        return startEditingElement !== null
      },
    },

    blockedItems: {
      startEditing: async () => {
        await userEvent.click(
          within(itemCard).getByLabelText('edit items blocked')
        )

        return {
          ...autocompleteFieldDriver({
            formElement: itemCard,
            id: 'items-blocked',
            input: { placeholder: 'Type to search' },
            chip: { label: 'blocked item' },
          }),
          save: async () => {
            await userEvent.click(
              within(itemCard).getByText('Save items blocked')
            )
          },
        }
      },
      item: (id: string) => {
        const goalElement = within(itemCard).getByTestId(`blocked-item-${id}`)

        return {
          click: async () => {
            await userEvent.click(goalElement)
          },
        }
      },
      header: () => {
        return within(itemCard).getByTestId('items-blocked-header').textContent
      },
      isStopEditingVisible: () => {
        const stopEditingElement = within(itemCard).queryByLabelText(
          'stop editing items blocked'
        )

        return stopEditingElement !== null
      },
      isStartEditingVisible: () => {
        const startEditingElement =
          within(itemCard).queryByLabelText('edit items blocked')

        return startEditingElement !== null
      },
    },

    blockedBy: {
      startEditing: async () => {
        await userEvent.click(
          within(itemCard).getByLabelText('edit blocked by items')
        )

        return {
          ...autocompleteFieldDriver({
            formElement: itemCard,
            id: 'blocked-by-items',
            input: { placeholder: 'Type to search' },
            chip: { label: 'blocked by item' },
          }),
          save: async () => {
            await userEvent.click(
              within(itemCard).getByText('Save blocked by items')
            )
          },
        }
      },
      item: (id: string) => {
        const goalElement = within(itemCard).getByTestId(
          `blocked-by-item-${id}`
        )

        return {
          click: async () => {
            await userEvent.click(goalElement)
          },
        }
      },
      header: () => {
        return within(itemCard).getByTestId('blocked-by-items-header')
          .textContent
      },
      isStopEditingVisible: () => {
        const stopEditingElement = within(itemCard).queryByLabelText(
          'stop editing blocked by items'
        )

        return stopEditingElement !== null
      },
      isStartEditingVisible: () => {
        const startEditingElement = within(itemCard).queryByLabelText(
          'edit blocked by items'
        )

        return startEditingElement !== null
      },
    },

    openDetailedView: {
      isRendered: () =>
        within(itemCard).queryByLabelText('open detailed view') !== null,
    },

    get text() {
      return within(itemCard).getByLabelText('item text').textContent
    },

    convertTo: {
      isRendered: () =>
        within(itemCard).queryByLabelText('convert item') !== null,
    },
  }
}

export default itemCardDriver
