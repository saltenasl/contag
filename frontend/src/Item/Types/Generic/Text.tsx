import { Grid } from '@contag/ui'
import RichTextRenderer from 'src/RichTextEditor/Components/RichTextEditor/RichTextRenderer'
import { Item } from 'src/types'

interface Props {
  item: Item
  isEditing: boolean
}

const ItemText = ({ item, isEditing }: Props) => {
  if (isEditing || item.summary?.shouldReplaceOriginalItem === true) {
    return null
  }

  return (
    <Grid aria-label='item text' sx={{ cursor: 'auto' }}>
      <RichTextRenderer text={item.text} richText={item.richText} />
    </Grid>
  )
}

export default ItemText
