import { ItemType } from 'src/generated/graphql'

export const getSubmitLabel = ({
  isEditing,
  type,
}: {
  isEditing: boolean
  type: ItemType
}) => {
  if (isEditing) {
    return 'submit edit'
  }

  switch (type) {
    case ItemType.Message:
      return 'send'
    default:
      return 'create'
  }
}
