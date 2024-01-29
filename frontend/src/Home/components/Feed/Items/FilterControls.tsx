import { Grid } from '@contag/ui'
import { ItemsFilters } from 'src/generated/graphql'
import { ChangeFilters } from '../../HomePage'
import ActionExpectationFilter from './ActionExpectationFilter'
import ItemTypeFilter from './ItemTypeFilter'

interface Props {
  changeFilters: ChangeFilters
  filters: ItemsFilters
}

const FilterControls = ({ changeFilters, filters }: Props) => {
  return (
    <Grid sx={{}}>
      <Grid display='inline-flex'>
        <ItemTypeFilter
          onChange={(itemType) => {
            changeFilters({
              ...filters,
              itemType,
            })
          }}
          value={filters.itemType ?? null}
        />
      </Grid>

      <Grid display='inline-flex'>
        <ActionExpectationFilter
          value={filters.actionExpectation ?? null}
          onChange={(actionExpectation) => {
            changeFilters({
              ...filters,
              actionExpectation,
            })
          }}
        />
      </Grid>
    </Grid>
  )
}

export default FilterControls
