import { cyanColor, Grid, useTheme } from '@contag/ui'
import RichTextRenderer from 'src/RichTextEditor/Components/RichTextEditor/RichTextRenderer'
import { Item } from 'src/types'

interface Props {
  item: Item
  isEditing: boolean
}

const ItemSummary = ({ item, isEditing }: Props) => {
  const theme = useTheme()

  if (isEditing || !item.summary) {
    return null
  }

  return (
    <Grid
      aria-label='summary'
      sx={{
        cursor: 'auto',
        whiteSpace: 'pre-line',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: cyanColor[600],
        m: theme.spacing(1),
        p: theme.spacing(1),
      }}
    >
      {/* render rich text editor */}
      TLDR:{' '}
      <RichTextRenderer
        text={item.summary.text}
        richText={item.summary.richText}
      />
    </Grid>
  )
}

export default ItemSummary
