import { Autocomplete, Checkbox, Chip, TextField } from '@contag/ui'
import { useAuth } from 'src/auth'
import { PublicUser } from 'src/generated/graphql'
import useGetPublicUsers from 'src/queries/getPublicUsers'

interface Props {
  id: string
  input: {
    label: string
    placeholder: string
  }
  chip: {
    label: string
  }
  onChange: (selected: PublicUser[]) => void
  value: PublicUser[]
  disableClearable?: boolean
  disableRemoveSelf?: boolean
}

const PublicUsersInput = ({
  onChange,
  value,
  id,
  chip,
  input,
  disableClearable = false,
  disableRemoveSelf = false,
}: Props) => {
  const { loading, publicUsers } = useGetPublicUsers()
  const auth = useAuth()

  return (
    <div data-testid={`${id}-field`}>
      <Autocomplete
        multiple
        id={id}
        loading={loading}
        value={value}
        options={publicUsers ?? []}
        onChange={(event, value) => {
          onChange(value)
        }}
        renderTags={(value, getTagProps) =>
          value.map((user, index: number) => (
            <Chip
              aria-label={chip.label}
              label={user.name ?? user.email}
              {...getTagProps({ index })}
              disabled={disableRemoveSelf && auth.user?.email === user.email}
            />
          ))
        }
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionDisabled={(option) =>
          disableRemoveSelf && auth.user?.email === option.email
        }
        disablePortal
        disableCloseOnSelect
        disableClearable={disableClearable}
        getOptionLabel={(option) => option.name ?? option.email}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox checked={selected} />
            {option.name ?? option.email}
          </li>
        )}
        style={{ width: 500 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={input.label}
            placeholder={input.placeholder}
          />
        )}
      />
    </div>
  )
}

export default PublicUsersInput
