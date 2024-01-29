import RichTextEditor, { RichTextValue } from './RichTextEditor'

interface Props {
  text: string
  richText?: object | null | undefined
}

const RichTextRenderer = ({ text, richText }: Props) => {
  if (process.env.NODE_ENV == 'test') {
    return <>{text}</>
  }

  const richTextValue: RichTextValue = {
    plainText: text,
    richText: richText ?? null,
  }

  return <RichTextEditor initialValue={richTextValue} readOnly />
}

export default RichTextRenderer
