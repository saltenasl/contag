import { useMutation } from '@apollo/client'
import {
  Container,
  Divider,
  Loader,
  IconButton,
  CheckIcon,
  DeleteIcon,
  AddPersonIcon,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
} from '@contag/ui'
import { useState } from 'react'
import cacheAcceptClientInvite from 'src/apollo/cache/clientInvite/accept'
import cacheDeclineClientInvite from 'src/apollo/cache/clientInvite/decline'
import { UserClientRole } from 'src/generated/graphql'
import ACCEPT_CLIENT_INVITE from 'src/mutations/acceptClientInvite'
import DECLINE_CLIENT_INVITE from 'src/mutations/declineClientInvite'
import useGetMyProfileQuery from 'src/queries/getMyProfile'
import InviteToClientDialog from './InviteToClientDialog'

const ClientsPage = () => {
  const { myProfile } = useGetMyProfileQuery()
  const [acceptClientInvite] = useMutation(ACCEPT_CLIENT_INVITE)
  const [declineClientInvite] = useMutation(DECLINE_CLIENT_INVITE)
  const [clientToInviteToId, setClientToInviteToId] = useState<null | string>(
    null
  )

  const theme = useTheme()

  if (!myProfile) {
    return <Loader />
  }

  return (
    <>
      {clientToInviteToId !== null && (
        <InviteToClientDialog
          clientId={clientToInviteToId}
          onClose={() => setClientToInviteToId(null)}
        />
      )}
      <Container sx={{ p: theme.spacing(2) }}>
        {myProfile.clientInvites.length > 0 && (
          <>
            <Divider textAlign='left'>Client invites</Divider>
            <List>
              {myProfile.clientInvites.map(({ id, client }) => (
                <ListItem
                  key={id}
                  secondaryAction={
                    <>
                      <IconButton
                        aria-label='accept invitation'
                        data-testid={`accept-client-${id}-invite`}
                        onClick={() =>
                          acceptClientInvite({
                            variables: { inviteId: id },
                            update(cache, result) {
                              if (result.data?.acceptClientInvite) {
                                cacheAcceptClientInvite(cache, {
                                  clientInviteId: id,
                                  myProfile,
                                  newUsersClient:
                                    result.data?.acceptClientInvite,
                                })
                              }
                            },
                          })
                        }
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        aria-label='decline invitation'
                        data-testid={`decline-client-${id}-invite`}
                        onClick={() =>
                          declineClientInvite({
                            variables: { inviteId: id },
                            update(cache, result) {
                              if (
                                result.data?.declineClientInvite?.success ===
                                true
                              ) {
                                cacheDeclineClientInvite(cache, {
                                  clientInviteId: id,
                                })
                              }
                            },
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText primary={client.name} />
                </ListItem>
              ))}
            </List>
          </>
        )}
        <Divider textAlign='left'>Currently joined clients</Divider>
        <List>
          {myProfile.clients.map(({ id, name, role, addedBy }) => (
            <ListItem
              key={id}
              data-testid={`client-list-item-${id}`}
              secondaryAction={
                role === UserClientRole.Owner ||
                role === UserClientRole.Admin ? (
                  <IconButton
                    aria-label='send an invite'
                    onClick={() => setClientToInviteToId(id)}
                  >
                    <AddPersonIcon />
                  </IconButton>
                ) : undefined
              }
            >
              <ListItemText
                primary={name}
                secondary={
                  <>
                    <Typography
                      component='span'
                      variant='body2'
                      color='text.primary'
                    >
                      {role}
                    </Typography>
                    {addedBy && <span>{` - Added by ${addedBy.email}`}</span>}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Container>
    </>
  )
}

export default ClientsPage
