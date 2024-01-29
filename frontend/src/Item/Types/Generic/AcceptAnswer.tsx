import ACCEPT_ANSWER from 'src/mutations/acceptAnswer'
import { useMutation } from '@apollo/client'
import {
  CheckCircleRoundedIcon,
  CheckIcon,
  IconButton,
  useTheme,
} from '@contag/ui'
import cacheAcceptAnswer from 'src/apollo/cache/item/acceptAnswer'
import { useItemsFeedContext } from '../../../Home/components/Feed/Items/Context'
import { Item } from 'src/types'

interface Props {
  item: Item
}

const AcceptAnswer = ({ item }: Props) => {
  const theme = useTheme()
  const [acceptAnswer] = useMutation(ACCEPT_ANSWER)
  const feedContext = useItemsFeedContext()

  if (item.isAcceptedAnswer === null) {
    return null
  }
  if (item.isAcceptedAnswer === true) {
    return (
      <CheckCircleRoundedIcon
        color='success'
        aria-label='this is the accepted answer'
        sx={{ m: theme.spacing(1) }}
      />
    )
  }

  return (
    <IconButton
      aria-label='accept as the answer'
      onClick={(event) => {
        event.stopPropagation()
        acceptAnswer({
          variables: { itemId: item.id },
          update(cache, result) {
            if (result.data?.acceptAnswer && feedContext) {
              cacheAcceptAnswer(cache, {
                item,
                parentFeedVariables: feedContext.parentFeedVariables,
                feedVariables: feedContext.variables,
              })
            }
          },
        })
      }}
    >
      <CheckIcon />
    </IconButton>
  )
}

export default AcceptAnswer
