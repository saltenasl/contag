import { gql } from 'src/generated'

const INVITE_TO_CLIENT = gql(`
  mutation InviteToClient($input: InviteToClientInput!) {
    inviteToClient(input: $input) {
      id
        client {
          id
          name
        }
        email
    }
  }`)

export default INVITE_TO_CLIENT
