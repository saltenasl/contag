import { TextField } from '@contag/ui'
import RichTextEditor from 'src/RichTextEditor'
import { RichTextValue } from 'src/RichTextEditor/Components/RichTextEditor/RichTextEditor'

interface Props {
  label: string
  value: RichTextValue
  onChange: (value: RichTextValue) => void
  autoFocus: boolean
  onSubmit?: () => void
}

const TestItemTextInput = ({ autoFocus, value, label, onChange }: Props) => (
  <TextField
    autoFocus={autoFocus}
    label={label}
    value={value.plainText}
    onChange={(event) => {
      onChange({ plainText: event.target.value, richText: null })
    }}
  />
)

const ItemTextInputField = ({
  value,
  onChange,
  autoFocus,
  label,
  onSubmit,
}: Props) => {
  if (process.env.NODE_ENV == 'test') {
    return (
      <TestItemTextInput
        value={value}
        onChange={onChange}
        label={label}
        autoFocus={autoFocus}
      />
    )
  }

  return (
    <RichTextEditor
      initialValue={value} // initial value reset the editor when .richText is equal to `null`
      onChange={onChange}
      label={label}
      autoFocus={autoFocus}
      onSubmit={onSubmit}
    />
  )
}

export default ItemTextInputField
