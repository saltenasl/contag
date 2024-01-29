import type { User, UsersClient } from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateAcceptClientInvite = ({
  inviteId,
  loggedInAs,
}: {
  inviteId: string
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation AcceptClientInvite($inviteId: ID!) {
      acceptClientInvite(inviteId: $inviteId) {
        id
        name
        addedBy {
          email
        }
        role
      }
    }`,
    {
      variables: { inviteId },
      headers: authenticated(loggedInAs),
    }
  )
}

const acceptClientInvite = async ({
  inviteId,
  loggedInAs,
}: {
  inviteId: string
  loggedInAs: User
}): Promise<UsersClient> => {
  const response = await mutateAcceptClientInvite({
    inviteId,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { acceptClientInvite: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default acceptClientInvite
