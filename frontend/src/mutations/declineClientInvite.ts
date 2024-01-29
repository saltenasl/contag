import { gql } from 'src/generated'

const DECLINE_CLIENT_INVITE = gql(`
  mutation DeclineClientInvite($inviteId: ID!) {
    declineClientInvite(inviteId: $inviteId) {
      success
    }
  }`)

export default DECLINE_CLIENT_INVITE
