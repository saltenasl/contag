import { Grid, AccountTreeIcon, useTheme, Button } from '@contag/ui'
import { useState } from 'react'
import { Item } from 'src/types'
import ChildrenSummary from './ChildrenSummary'

interface Props {
  item: Item
}

const ChildCount = ({ item }: Props) => {
  const theme = useTheme()
  const { childCount, id } = item
  const [isSummaryVisible, setIsSummaryVisible] = useState(false)

  if (childCount === 0) {
    return null
  }

  return (
    <Grid
      display='flex'
      sx={{
        flexDirection: 'column',
      }}
    >
      <Button
        onClick={(event) => {
          event.stopPropagation()
          setIsSummaryVisible(!isSummaryVisible)
        }}
        startIcon={<AccountTreeIcon sx={{ pr: theme.spacing(1) }} />}
      >
        {childCount}
        {childCount === 1 ? ' child item' : ' child items'}
      </Button>

      {isSummaryVisible ? <ChildrenSummary parentId={id} /> : null}
    </Grid>
  )
}

export default ChildCount
