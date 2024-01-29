import { TypeName } from '@contag/graphql-api/src/constants'
import { FlagIcon, HelpIcon, InfoIcon, MessageIcon, TaskIcon } from '@contag/ui'
import { Item } from 'src/generated/graphql'

interface Props {
  type: Item['__typename']
}

// note - opacity is an arbitrary number to match the color of icons in ItemTypeToggleGroup
const ItemIcon = ({ type }: Props) => {
  if (type === TypeName.TASK) {
    return <TaskIcon aria-label='task' sx={{ opacity: '0.62' }} />
  }

  if (type === TypeName.MESSAGE) {
    return <MessageIcon aria-label='message' sx={{ opacity: '0.62' }} />
  }

  if (type === TypeName.QUESTION) {
    return <HelpIcon aria-label='question' sx={{ opacity: '0.62' }} />
  }

  if (type === TypeName.INFO) {
    return <InfoIcon aria-label='info' sx={{ opacity: '0.62' }} />
  }

  if (type === TypeName.GOAL) {
    return <FlagIcon aria-label='goal' sx={{ opacity: '0.62' }} />
  }

  return null
}

export default ItemIcon
