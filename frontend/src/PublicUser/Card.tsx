import {
  CardActions,
  CardHeader,
  Grid,
  IconButton,
  MessageIcon,
  ItemCard,
} from '@contag/ui'
import { PublicUser } from 'src/generated/graphql'
import PublicUserAvatar from './Avatar'

type Props = {
  publicUser: PublicUser
  onMessageUser: React.MouseEventHandler
  active: boolean
}

const PublicUserCard = ({ publicUser, onMessageUser, active }: Props) => (
  <Grid key={publicUser.id}>
    <ItemCard
      type='person'
      active={active}
      data-testid={`person-${publicUser.id}`}
    >
      <CardHeader
        title={publicUser.name}
        avatar={<PublicUserAvatar user={publicUser} />}
      />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton
          aria-label={`message ${publicUser.name}`}
          onClick={onMessageUser}
        >
          <MessageIcon />
        </IconButton>
      </CardActions>
    </ItemCard>
  </Grid>
)

export default PublicUserCard
