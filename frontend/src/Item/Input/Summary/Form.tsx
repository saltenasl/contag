import { useMutation } from '@apollo/client'
import {
  CheckIcon,
  DeleteIcon,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  useTheme,
} from '@contag/ui'
import { useState } from 'react'
import DELETE_ITEM_SUMMARY from 'src/mutations/deleteItemSummary'
import SUMMARIZE_ITEM from 'src/mutations/summarizeItem'
import { RichTextValue } from 'src/RichTextEditor/Components/RichTextEditor/RichTextEditor'
import { Item } from 'src/types'
import ItemTextInputField from '../TextField'

interface Props {
  item: Item
  stopSummarizing: () => void
}

const SummaryForm = ({ item, stopSummarizing }: Props) => {
  const theme = useTheme()
  const [text, setText] = useState<RichTextValue>({
    plainText: item.summary?.text || '',
    richText: item.summary?.richText ?? null,
  })
  const [shouldReplaceOriginalItem, setShouldReplaceOriginalItem] = useState(
    item.summary?.shouldReplaceOriginalItem || false
  )
  const [summarizeItem] = useMutation(SUMMARIZE_ITEM)
  const [deleteItemSummary] = useMutation(DELETE_ITEM_SUMMARY)

  const isSummaryEmpty = text.plainText.length === 0

  const submit = () => {
    if (isSummaryEmpty) {
      return
    }

    summarizeItem({
      variables: {
        itemId: item.id,
        text: text.plainText,
        shouldReplaceOriginalItem,
        richText: text.richText,
      },
      onCompleted() {
        stopSummarizing()
      },
    })
  }

  return (
    <Grid
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          stopSummarizing()
        }
      }}
    >
      <Grid sx={{ marginBottom: theme.spacing(-2) }}>
        <FormControlLabel
          control={
            <Switch
              checked={shouldReplaceOriginalItem}
              onChange={() => {
                setShouldReplaceOriginalItem(!shouldReplaceOriginalItem)
              }}
            />
          }
          label='Override item text'
          sx={{ pl: theme.spacing(2) }}
        />
      </Grid>
      <Grid display='flex'>
        <Grid display='flex'>
          <IconButton
            aria-label='delete summary'
            disabled={!item.summary}
            onClick={() => {
              deleteItemSummary({
                variables: { itemId: item.id },
                onCompleted() {
                  stopSummarizing()
                },
              })
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <ItemTextInputField
            label='Type summary here'
            value={text}
            onChange={(text) => setText(text)}
            autoFocus
            onSubmit={submit}
          />
        </Grid>
        <Grid display='flex'>
          <IconButton
            aria-label='submit summary'
            color='primary'
            disabled={isSummaryEmpty}
            onClick={() => {
              submit()
            }}
          >
            <CheckIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default SummaryForm
