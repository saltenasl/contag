import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemType } from 'src/generated/graphql'
import { getSubmitLabel } from 'src/Item/Input/utils'
import publicUserFieldDriver from './fields/autocomplete'

const itemFormDriver = (parentElement: HTMLElement) => {
  const formElement = within(parentElement).getByLabelText('item form')

  expect(formElement).toBeInTheDocument()

  return {
    assignees: () => {
      return publicUserFieldDriver({
        formElement,
        id: 'assignees',
        input: { placeholder: 'Assignee' },
        chip: {
          label: 'assigned person',
        },
      })
    },
    sharedWith: () => {
      return publicUserFieldDriver({
        formElement,
        id: 'shared-with',
        input: { placeholder: 'Share with' },
        chip: {
          label: 'shared with person',
        },
      })
    },
    isClosed: () => {
      expect(formElement).not.toBeInTheDocument()
    },
    updateTextField: async ({
      label,
      text,
    }: {
      label: string
      text: string
    }) => {
      const textInput = within(formElement).getByLabelText(label)

      await userEvent.type(textInput, text)
    },
    isSubmitRendered: ({
      isEditing,
      itemType,
    }: {
      isEditing: boolean
      itemType: ItemType
    }) => {
      return !!within(formElement).queryByLabelText(
        getSubmitLabel({ isEditing, type: itemType })
      )
    },
    submit: async ({
      isEditing,
      itemType,
    }: {
      isEditing: boolean
      itemType: ItemType
    }) => {
      await userEvent.click(
        within(formElement).getByLabelText(
          getSubmitLabel({ isEditing, type: itemType })
        )
      )
    },
  }
}

export default itemFormDriver
