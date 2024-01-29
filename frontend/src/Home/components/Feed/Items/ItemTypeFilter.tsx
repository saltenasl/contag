import {
  FlagIcon,
  HelpIcon,
  InfoIcon,
  MessageIcon,
  TaskIcon,
  ToggleButton,
  ToggleButtonGroup,
} from '@contag/ui'
import { ItemTypeFilters } from 'src/generated/graphql'

interface Props {
  value: ItemTypeFilters | null
  onChange: (itemType: ItemTypeFilters | null) => void
}

enum Filters {
  ALL = 'all',
  GOAL = 'goal',
  INFO = 'info',
  QUESTION = 'question',
  TASK = 'task',
  MESSAGE = 'message',
}

const isFilter = (string: string): string is Filters =>
  Object.values(Filters).includes(string as Filters)

const areAllFiltersOn = (filters: ItemTypeFilters) =>
  Object.values(filters).every((value) => value === true) &&
  Object.values(filters).length === Object.values(Filters).length - 1

const convertFiltersObjectToTypesArray = (
  filters: ItemTypeFilters | null
): Filters[] => {
  if (filters === null || areAllFiltersOn(filters)) {
    return [Filters.ALL]
  }

  return (
    Object.entries(filters)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
      .filter(isFilter)
  )
}

const wasAllClicked = (
  previousFilters: ItemTypeFilters | null,
  optionsSelected: Filters[]
) => {
  if (previousFilters === null) {
    return false
  }

  if (areAllFiltersOn(previousFilters)) {
    return false
  }

  return optionsSelected.includes(Filters.ALL)
}

const ItemTypeFilter = ({ value, onChange }: Props) => {
  return (
    <ToggleButtonGroup
      value={convertFiltersObjectToTypesArray(value)}
      onChange={(event, enabledFilters: Filters[] | null) => {
        event.stopPropagation()

        if (enabledFilters === null || enabledFilters.length === 0) {
          return
        }

        if (wasAllClicked(value, enabledFilters)) {
          onChange(null)
          return
        }

        onChange(
          enabledFilters
            .filter((value) => value !== Filters.ALL)
            .reduce(
              (accumulator, value) => ({
                ...accumulator,
                [value]: true,
              }),
              {}
            )
        )
      }}
      size='small'
      aria-label='item type filter'
    >
      <ToggleButton value={Filters.ALL} aria-label='all'>
        all
      </ToggleButton>
      <ToggleButton value={Filters.GOAL} aria-label='goal'>
        <FlagIcon />
      </ToggleButton>
      <ToggleButton value={Filters.INFO} aria-label='info'>
        <InfoIcon />
      </ToggleButton>
      <ToggleButton value={Filters.QUESTION} aria-label='question'>
        <HelpIcon />
      </ToggleButton>
      <ToggleButton value={Filters.TASK} aria-label='task'>
        <TaskIcon />
      </ToggleButton>
      <ToggleButton value={Filters.MESSAGE} aria-label='message'>
        <MessageIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ItemTypeFilter
