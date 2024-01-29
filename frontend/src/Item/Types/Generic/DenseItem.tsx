import { Grid, Paper, useTheme } from '@contag/ui'
import { GetChildrenQuery } from 'src/generated/graphql'
import ActionExpectation from './ActionExpectation'
import ItemIcon from './ItemIcon'
import { getItemTextSummary } from './utils'

interface Props {
  item: GetChildrenQuery['items'][number]
  onClick?: () => void
}

const DenseItem = ({ item, onClick }: Props) => {
  const theme = useTheme()

  return (
    <Paper
      key={item.id}
      data-testid={`item-${item.id}-summary`}
      aria-label='item summary'
      sx={{
        ':hover': {
          backgroundColor: onClick ? theme.palette.grey[500] : undefined,
        },
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      <Grid display='flex' sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Grid display='inline-flex' sx={{ flexShrink: 0 }}>
          <ItemIcon type={item.__typename} />
        </Grid>

        {'actionExpectation' in item ? (
          <ActionExpectation
            actionExpectation={item.actionExpectation}
            to={item.to}
          />
        ) : null}

        <Grid display='inline-flex'>
          {getItemTextSummary(item).text.substring(0, 200)}
          {getItemTextSummary(item).text.length > 200 ? '...' : ''}
        </Grid>
      </Grid>
    </Paper>
  )
}

export default DenseItem
