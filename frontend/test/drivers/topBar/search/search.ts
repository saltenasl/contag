import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import searchResultsDriver from './results'

const searchDriver = (parentElement: HTMLElement) => {
  const searchContainer = within(parentElement).getByTestId('search-container')

  expect(searchContainer).toBeInTheDocument()

  const getSearchInput = (): HTMLInputElement =>
    within(searchContainer).getByLabelText('search')

  return {
    input: {
      getValue: () => getSearchInput().value,

      setTerm: async (search: string) => {
        const user = userEvent.setup({ delay: null })

        await user.clear(getSearchInput())
        await user.type(getSearchInput(), search)
      },
    },

    get results() {
      return searchResultsDriver(searchContainer)
    },
  }
}

export default searchDriver
