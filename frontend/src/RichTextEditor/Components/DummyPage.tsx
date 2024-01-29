import { Grid, Typography } from '@contag/ui'
import { useState } from 'react'
import RichTextEditor, { RichTextValue } from './RichTextEditor/RichTextEditor'

const initialValue: RichTextValue = {
  plainText: 'Hi!',
  richText: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hi! oh' }] },
      { type: 'paragraph' },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'who are you?' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'task' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'second task' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'cookooo' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'larger coookoooooo' }],
              },
            ],
          },
        ],
      },
    ],
  },
}

const RichTextEditorDummyPage = () => {
  const [value, setValue] = useState<RichTextValue>(initialValue)

  console.log(value, JSON.stringify(value.richText))

  return (
    <Grid container>
      <Grid md={4}>
        <Typography variant='h4'>Editor</Typography>
        <RichTextEditor
          initialValue={initialValue}
          onChange={(newValue) => {
            setValue(newValue)
          }}
        />
      </Grid>
      <Grid md={4}>
        <Typography variant='h4'>Preview</Typography>
        <RichTextEditor readOnly initialValue={value} />
      </Grid>
    </Grid>
  )
}

export default RichTextEditorDummyPage
