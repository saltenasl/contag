import type { User } from 'src/generated/graphql'
import type { LoggedInUser } from 'test/e2e/utils/factories/loggedInUser'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const queryUser = ({
  loggedInAs,
}: {
  loggedInAs: User | LoggedInUser
}) =>
  request(
    `#graphql
  query GetCurrentlyLoggedInUserDetails {
    myProfile {
      id
      email
      name
      photoURL
      clients {
        id
        name
        addedBy {
          email
        }
        role
      }
      createdAt
      updatedAt
      clientInvites {
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
    }
  }`,
    { headers: authenticated(loggedInAs) }
  )

const getUser = async ({
  loggedInAs,
}: {
  loggedInAs: User | LoggedInUser
}): Promise<User> => {
  const response = await queryUser({ loggedInAs })

  expect(response.status).toBe(200)

  const {
    data: { myProfile },
  } = await response.json()

  return myProfile
}

export default getUser
