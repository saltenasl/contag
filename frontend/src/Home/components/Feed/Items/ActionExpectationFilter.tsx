import { ToggleButton, ToggleButtonGroup } from '@contag/ui'
import { ActionExpectationFiltersInput } from 'src/generated/graphql'

interface Props {
  value: ActionExpectationFiltersInput | null
  onChange: (newFilters: ActionExpectationFiltersInput | null) => void
}

enum Filters {
  ALL = 'all',
  TODO = 'todo',
  DONE = 'done',
  NA = 'na',
}

const isFilter = (string: string): string is Filters =>
  Object.values(Filters).includes(string as Filters)

const areAllFiltersOn = (filters: ActionExpectationFiltersInput) =>
  Object.values(filters).every((value) => value === true) &&
  Object.values(filters).length === Object.values(Filters).length - 1

const convertFiltersObjectToTypesArray = (
  filters: ActionExpectationFiltersInput | null
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
  previousFilters: ActionExpectationFiltersInput | null,
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

const ActionExpectationFilter = ({ value, onChange }: Props) => (
  <ToggleButtonGroup
    aria-label='action expectation filter'
    value={convertFiltersObjectToTypesArray(value)}
    onChange={(event, enabledFilters: Filters[] | null) => {
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
  >
    <ToggleButton value={Filters.ALL} aria-label='all'>
      all
    </ToggleButton>
    <ToggleButton value={Filters.TODO} aria-label='todo'>
      todo
    </ToggleButton>
    <ToggleButton value={Filters.DONE} aria-label='done'>
      done
    </ToggleButton>
    <ToggleButton value={Filters.NA} aria-label='not available'>
      n/a
    </ToggleButton>
  </ToggleButtonGroup>
)

export default ActionExpectationFilter
