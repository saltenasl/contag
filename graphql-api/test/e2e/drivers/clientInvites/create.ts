import { faker } from '@faker-js/faker'
import type {
  InviteToClient,
  InviteToClientInput,
  User,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateInviteToClient = ({
  input,
  loggedInAs,
}: {
  input: InviteToClientInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation InviteToClient($input: InviteToClientInput!) {
      inviteToClient(input: $input) {
        id
        client {
          id
          name
        }
        email
        invitedBy {
          email
        }
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const inviteToClient = async ({
  clientId,
  email = faker.internet.email(),
  loggedInAs,
}: {
  clientId: string
  email?: string
  loggedInAs: User
}): Promise<InviteToClient> => {
  const response = await mutateInviteToClient({
    input: {
      clientId,
      email,
    },
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { inviteToClient: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default inviteToClient
