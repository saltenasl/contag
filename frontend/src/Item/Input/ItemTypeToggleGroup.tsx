import {
  FlagIcon,
  HelpIcon,
  InfoIcon,
  MessageIcon,
  TaskIcon,
  ToggleButton,
  ToggleButtonGroup,
} from '@contag/ui'
import { useState } from 'react'
import { ItemType } from 'src/generated/graphql'

type Props = {
  onChange: (itemType: ItemType) => void
  initialValue: ItemType
  'aria-label'?: string
}

const ItemTypeToggleGroup = ({
  initialValue,
  onChange,
  'aria-label': ariaLabel = 'item type',
}: Props) => {
  const [type, setType] = useState(initialValue ?? '')

  return (
    <ToggleButtonGroup
      value={type}
      exclusive
      onChange={(event, newType: ItemType | '' | null) => {
        event.stopPropagation()

        if (newType === '' || newType === null) {
          return
        }

        setType(newType)
        onChange(newType)
      }}
      size='small'
      aria-label={ariaLabel}
    >
      <ToggleButton value={ItemType.Goal} aria-label='goal'>
        <FlagIcon />
      </ToggleButton>
      <ToggleButton value={ItemType.Info} aria-label='info'>
        <InfoIcon />
      </ToggleButton>
      <ToggleButton value={ItemType.Question} aria-label='question'>
        <HelpIcon />
      </ToggleButton>
      <ToggleButton value={ItemType.Task} aria-label='task'>
        <TaskIcon />
      </ToggleButton>
      <ToggleButton value={ItemType.Message} aria-label='message'>
        <MessageIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ItemTypeToggleGroup
