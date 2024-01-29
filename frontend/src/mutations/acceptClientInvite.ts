import { gql } from 'src/generated'

const ACCEPT_CLIENT_INVITE = gql(`
  mutation AcceptClientInvite($inviteId: ID!) {
    acceptClientInvite(inviteId: $inviteId) {
      id
      name
      role
      addedBy {
        id
        name
        email
      }
    }
  }`)

export default ACCEPT_CLIENT_INVITE
