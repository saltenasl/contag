import type { GenericMutationResponse, User } from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateDeclineClientInvite = ({
  inviteId,
  loggedInAs,
}: {
  inviteId: string
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation DeclineClientInvite($inviteId: ID!) {
      declineClientInvite(inviteId: $inviteId) {
        success
        message
      }
    }`,
    {
      variables: { inviteId },
      headers: authenticated(loggedInAs),
    }
  )
}

const declineClientInvite = async ({
  inviteId,
  loggedInAs,
}: {
  inviteId: string
  loggedInAs: User
}): Promise<GenericMutationResponse> => {
  const response = await mutateDeclineClientInvite({
    inviteId,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { declineClientInvite: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default declineClientInvite
