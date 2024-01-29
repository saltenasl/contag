import type { InviteToClient, User } from 'src/generated/graphql'
import getUser from '../user/get'

const getClientInvites = async ({
  loggedInAs,
}: {
  loggedInAs: User
}): Promise<InviteToClient[]> => {
  const { clientInvites } = await getUser({ loggedInAs })

  return clientInvites
}

export default getClientInvites
