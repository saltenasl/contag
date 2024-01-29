import { waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const autocompleteFieldDriver = ({
  formElement,
  id,
  input: { placeholder },
  chip: { label: chipLabel },
  noOptionsText = 'No options',
}: {
  formElement: HTMLElement
  id: string
  input: { placeholder: string }
  chip: { label: string }
  noOptionsText?: string
}) => {
  const autocompleteField = within(formElement).getByTestId(`${id}-field`)
  expect(autocompleteField).toBeInTheDocument()

  // rename to selected options
  const getSelectedOptions = () => {
    const optionElements =
      within(autocompleteField).queryAllByLabelText(chipLabel)

    return optionElements.map((element) => element.textContent)
  }

  return {
    options: {
      isRendered: () => {
        expect(
          within(autocompleteField).getByRole('presentation')
        ).toBeInTheDocument()
      },
      isNotRendered: () => {
        expect(
          within(autocompleteField).queryByRole('presentation')
        ).not.toBeInTheDocument()
      },
      open: async () => {
        await userEvent.click(
          within(autocompleteField).getByPlaceholderText(placeholder)
        )
      },
      toggleOption: async (optionLabel: string) => {
        const options = within(autocompleteField).getByRole('presentation')

        const option = within(options).getByText(optionLabel)
        expect(option).toBeInTheDocument()

        await userEvent.click(option)
      },
      listDisabled: () => {
        const optionsList = within(autocompleteField).getByRole('presentation')

        const options = within(optionsList).getAllByRole('option')

        return Array.from(options)
          .filter(
            (option) =>
              option.attributes.getNamedItem('aria-disabled')?.value === 'true'
          )
          .map((option) => option.textContent)
      },
      list: () => {
        const optionsList = within(autocompleteField).getByRole('presentation')

        const options = within(optionsList).getAllByRole('option')

        return Array.from(options).map((option) => option.textContent)
      },
      waitForOptionsToLoad: async () => {
        await waitFor(() => {
          expect(
            within(autocompleteField).queryByText('Loading...')
          ).not.toBeInTheDocument()
        })
      },
    },
    hasZeroOptions: () => {
      const noOptions = within(autocompleteField).queryByText(noOptionsText)

      return noOptions !== null
    },
    search: async (term: string) => {
      const textInput = within(autocompleteField).getByRole('combobox')

      await userEvent.clear(textInput)
      await userEvent.type(textInput, term)
    },
    getSelectedOptions,
    isOptionSelected: (name: string) =>
      getSelectedOptions().some((option) => name === option),
  }
}

export default autocompleteFieldDriver
