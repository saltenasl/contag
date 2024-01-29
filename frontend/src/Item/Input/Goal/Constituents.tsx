import { Autocomplete, Checkbox, Chip, TextField } from '@contag/ui'
import { useState } from 'react'
import { getItemTextSummary } from 'src/Item/Types/Generic/utils'
import useGetSearchItems, { Item } from 'src/queries/getSearchItems'
import { useDebounce } from 'use-debounce'

interface Props {
  onChange: (constituents: Item[]) => void
  values: Item[]
}

const DEBOUNCE_SEARCH_MS = 200

const GoalConstituentsInput = ({ onChange, values }: Props) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, DEBOUNCE_SEARCH_MS)

  const { loading, items } = useGetSearchItems({
    search: debouncedSearch,
    skip: debouncedSearch === '' || !open,
  })

  const itemsALWAYSIncludingSelectedValues = items // this is used only to suppress mui warning (https://github.com/mui/material-ui/issues/29727#issuecomment-1036226466)
    ? [
        ...items.filter(
          (item) => !values.some((value) => value.id === item.id)
        ),
        ...values,
      ]
    : []

  return (
    <div data-testid={`goal-constituents-field`}>
      <Autocomplete
        multiple
        loading={loading}
        value={values}
        onOpen={() => {
          setOpen(true)
        }}
        onClose={() => {
          setOpen(false)
        }}
        options={itemsALWAYSIncludingSelectedValues}
        onChange={(event, value) => {
          onChange(value)
        }}
        renderTags={(value, getTagProps) =>
          value.map((item, index: number) => (
            <Chip
              aria-label='goal constituent'
              label={getItemTextSummary(item).text}
              {...getTagProps({ index })}
            />
          ))
        }
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disablePortal
        disableCloseOnSelect
        disableClearable
        getOptionLabel={(option) => getItemTextSummary(option).text}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox checked={selected} />
            {getItemTextSummary(option).text}
          </li>
        )}
        style={{ width: 500 }}
        renderInput={(params) => (
          <TextField
            {...params}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
            }}
            label='Constituents'
            placeholder='Type to search'
          />
        )}
      />
    </div>
  )
}

export default GoalConstituentsInput
