import { List, ListItem } from '@contag/ui'
import FileDownloadLink from 'src/FileUpload/FileDownloadLink'
import { Item } from 'src/types'

interface Props {
  item: Item
}

const Attachments = ({ item }: Props) => {
  if (!item.attachments || item.attachments.length === 0) {
    return <></>
  }

  return (
    <List dense>
      {item.attachments.map((attachment) => (
        <ListItem key={attachment.id}>
          <FileDownloadLink file={attachment} />
        </ListItem>
      ))}
    </List>
  )
}

export default Attachments
