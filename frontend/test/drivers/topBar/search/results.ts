import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const tabDriver = ({
  getElement,
  contentItemLabel,
  id,
}: {
  getElement: () => HTMLElement
  contentItemLabel: string
  id: string
}) => {
  const getTabHeader = () =>
    within(getElement()).getByTestId(`${id}-tab-header`)

  return {
    header: {
      get text() {
        return getTabHeader().textContent
      },
      click: async () => {
        const user = userEvent.setup({ delay: null })
        await user.click(getTabHeader())
      },
    },
    get isActive() {
      return (
        getTabHeader().attributes.getNamedItem('aria-selected')?.value ===
        'true'
      )
    },
    get content() {
      const tabContent = within(getElement()).getByTestId(`${id}-tab-content`)

      return {
        text: tabContent.textContent,

        listItemsText: () =>
          within(tabContent)
            .queryAllByLabelText(contentItemLabel)
            .map((element) => element.textContent),
      }
    },
  }
}

const searchResultsDriver = (parentElement: HTMLElement) => {
  const getElement = () => within(parentElement).getByLabelText('results')

  return {
    areVisible: () => {
      expect(getElement()).toBeInTheDocument()
    },

    areNotVisible: () => {
      expect(
        within(parentElement).queryByLabelText('results')
      ).not.toBeInTheDocument()
    },

    get itemsTab() {
      return tabDriver({
        getElement,
        contentItemLabel: 'item summary',
        id: 'items',
      })
    },

    get usersTab() {
      return tabDriver({
        getElement,
        contentItemLabel: 'user summary',
        id: 'users',
      })
    },
  }
}

export default searchResultsDriver
