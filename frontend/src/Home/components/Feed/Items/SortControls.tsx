import {
  Button,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@contag/ui'
import {
  ItemsSortOrder,
  ItemsSortType,
  GetItemsQueryVariables,
} from 'src/generated/graphql'
import { ChangeSort } from '../../HomePage'

interface Props {
  changeSort: ChangeSort
  variables: GetItemsQueryVariables
}

const SortControls = ({ changeSort, variables }: Props) => {
  const theme = useTheme()

  return (
    <Grid sx={{ marginBottom: theme.spacing(-2) }}>
      <Grid>
        <ToggleButtonGroup
          value={variables.sort.type}
          size='small'
          exclusive
          onChange={(event, sortType: ItemsSortType | null) => {
            if (sortType === null) {
              return
            }

            changeSort({
              type: sortType,
              order: ItemsSortOrder.NewestFirst,
            })
          }}
          aria-label='sort by'
        >
          <ToggleButton
            value={ItemsSortType.CreatedAt}
            aria-label='creation date'
          >
            Created at
          </ToggleButton>
          <ToggleButton
            value={ItemsSortType.CompleteUntil}
            aria-label='Expected by date'
          >
            Expected by
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          onClick={() => {
            changeSort({
              type: variables.sort.type,
              order:
                variables.sort.order === ItemsSortOrder.NewestFirst
                  ? ItemsSortOrder.OldestFirst
                  : ItemsSortOrder.NewestFirst,
            })
          }}
        >
          toggle sort
        </Button>
      </Grid>
    </Grid>
  )
}

export default SortControls
