import { Loader, Grid, Typography } from '@contag/ui'
import PublicUserItem from '../../../PublicUser'
import { ChangeActiveItem } from '../HomePage'
import FeedContainer from './Container'
import useGetPublicUsers from 'src/queries/getPublicUsers'

const PublicUsersFeed = ({
  id,
  activeItemId,
  changeActiveItem,
}: {
  id: string
  activeItemId: null | string
  changeActiveItem: ChangeActiveItem
}) => {
  const { publicUsers } = useGetPublicUsers()

  if (!publicUsers) {
    return (
      <FeedContainer scrollIntoViewOnMount={false} id={id}>
        <Loader />
      </FeedContainer>
    )
  }

  return (
    <FeedContainer scrollIntoViewOnMount={false} id={id}>
      {publicUsers.length === 0 ? (
        <Grid sx={{ textAlign: 'center' }}>
          <Typography>No one to send messages to</Typography>
          <Typography>Start by adding someone to your client</Typography>
        </Grid>
      ) : (
        <Grid container justifyContent='center' direction='column' spacing={2}>
          {publicUsers.map((item) => {
            const setItemAsActive = () => {
              const selection = window.getSelection()

              if (selection?.type === 'Range') {
                return
              }

              changeActiveItem(item.id)
            }

            return (
              <PublicUserItem
                key={item.id}
                active={item.id === activeItemId}
                publicUser={item}
                onMessageUser={setItemAsActive}
              />
            )
          })}
        </Grid>
      )}
    </FeedContainer>
  )
}

export default PublicUsersFeed
