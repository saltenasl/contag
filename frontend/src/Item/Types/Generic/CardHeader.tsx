import {
  CloseIcon,
  EditIcon,
  Grid,
  IconButton,
  OpenInNewIcon,
  SummarizeIcon,
  useTheme,
} from '@contag/ui'
import { useNavigate } from 'react-router-dom'
import { useItemsFeedContext } from 'src/Home/components/Feed/Items/Context'
import { Item } from 'src/types'
import PublicUserAvatar from '../../../PublicUser/Avatar'
import AcceptAnswer from './AcceptAnswer'
import ActionExpectation from './ActionExpectation'
import ConvertItemTo from './ConvertItemTo'
import ItemIcon from './ItemIcon'

interface Props {
  item: Item
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
  isSummarizing: boolean
  setIsSummarizing: (isSummarizing: boolean) => void
}

const ItemCardHeader = ({
  item,
  isEditing,
  setIsEditing,
  isSummarizing,
  setIsSummarizing,
}: Props) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const feedContext = useItemsFeedContext()

  return (
    <>
      <Grid container sx={{ justifyContent: 'space-between' }}>
        <Grid sx={{ fontSize: '0.9rem' }} aria-label='author'>
          {item.__typename !== 'Message' ? (
            <ItemIcon type={item.__typename} />
          ) : null}
          <PublicUserAvatar user={item.author} />
        </Grid>
        <Grid
          container
          spacing={1}
          sx={{
            fontSize: '0.9rem',
            flexDirection: 'row',
            p: theme.spacing(1),
          }}
        >
          <Grid>Shared with:</Grid>
          {item.sharedWith
            .filter(({ id }) => id !== item.author.id)
            .map((user) => (
              <Grid key={user.id} aria-label='shared with'>
                <PublicUserAvatar small user={user} />
              </Grid>
            ))}
        </Grid>
        <Grid sx={{ fontSize: '0.8rem' }}>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })}
        </Grid>
        <Grid container sx={{ p: theme.spacing(2), alignItems: 'center' }}>
          {isSummarizing ? (
            <IconButton
              aria-label='stop summarizing'
              onClick={(event) => {
                event.stopPropagation()
                setIsSummarizing(false)
              }}
            >
              <CloseIcon color='primary' />
            </IconButton>
          ) : (
            <IconButton
              aria-label='summarize item'
              onClick={(event) => {
                event.stopPropagation()
                setIsSummarizing(true)
              }}
            >
              <SummarizeIcon />
            </IconButton>
          )}
          <AcceptAnswer item={item} />
          {isEditing ? null : <ConvertItemTo item={item} />}
          {/* HACK: stops nasty UX where changing type during edit loses edits.
          https://contagapp.com/item/Item:617 */}
          {feedContext !== undefined ? (
            <IconButton
              aria-label='open detailed view'
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                navigate(`/item/${item.id}`)
              }}
              href={`/item/${item.id}`}
            >
              <OpenInNewIcon />
            </IconButton>
          ) : null}
          {isEditing ? (
            <IconButton
              aria-label='stop editing'
              onClick={(event) => {
                event.stopPropagation()
                setIsEditing(false)
              }}
            >
              <CloseIcon color='primary' />
            </IconButton>
          ) : (
            <IconButton
              aria-label='edit'
              onClick={(event) => {
                event.stopPropagation()
                setIsEditing(true)
              }}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </Grid>
      </Grid>

      {'actionExpectation' in item ? (
        <ActionExpectation
          actionExpectation={item.actionExpectation}
          to={item.to}
        />
      ) : null}
    </>
  )
}

export default ItemCardHeader
