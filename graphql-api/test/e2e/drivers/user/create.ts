import type { User } from 'src/generated/graphql'
import type { LoggedInUser } from '../../utils/factories/loggedInUser'
import loggedInUserFactory from '../../utils/factories/loggedInUser'
import getUser from './get'

const createUser = async ({
  loggedInAs = loggedInUserFactory.build(),
}: { loggedInAs?: LoggedInUser } = {}): Promise<User> => {
  return await getUser({ loggedInAs })
}

export default createUser
