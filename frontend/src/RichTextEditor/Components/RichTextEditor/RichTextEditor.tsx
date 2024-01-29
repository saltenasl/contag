import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import './style.css'

export interface RichTextValue {
  plainText: string
  richText: JSONContent | null
}

interface Props {
  readOnly?: boolean
  initialValue: RichTextValue
  onChange?: (newValue: RichTextValue) => void
  label?: string
  autoFocus?: boolean
  onSubmit?: () => void
}

const RichTextEditor = ({
  initialValue,
  onChange,
  readOnly = false,
  label,
  autoFocus = false,
  onSubmit,
}: Props) => {
  const editor = useEditor({
    editable: !readOnly,
    autofocus: !readOnly && autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        'data-testid': 'rich-text-editor',
        class: readOnly ? 'read-only' : 'editable',
      },
      handleDOMEvents: {
        keydown: onSubmit
          ? (_, event) => {
              if (event.key === 'Enter') {
                if (event.metaKey) {
                  event.preventDefault()
                  onSubmit()
                }
              }
            }
          : undefined,
      },
    },
    extensions: [StarterKit.configure({ heading: false })],
    content: initialValue.richText ?? initialValue.plainText,
    onUpdate: ({ editor }) => {
      onChange?.({
        richText: editor.getJSON(),
        plainText: editor.view.dom.innerText,
      })
    },
  })

  useEffect(() => {
    if (initialValue.richText === null && initialValue.plainText === '') {
      editor?.commands.setContent(initialValue.richText)
    }
  }, [initialValue.richText])

  return (
    <EditorContent readOnly={readOnly} editor={editor} placeholder={label} />
  )
}

export default RichTextEditor
