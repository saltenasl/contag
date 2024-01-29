import type {
  PublicUser,
  PublicUsersFilters,
  User,
} from 'src/generated/graphql'
import authenticated from 'test/e2e/utils/authenticated'
import request from 'test/e2e/utils/request'

export const queryPublicUsers = ({
  loggedInAs,
  filters,
}: {
  loggedInAs?: User | undefined
  filters?: PublicUsersFilters | undefined
}) =>
  request(
    `#graphql
    query GetPublicUsers($filters: PublicUsersFilters) {
      publicUsers(filters: $filters) {
        id
        email
        name
        photoURL
        active
      }
    }`,
    { headers: authenticated(loggedInAs), variables: { filters } }
  )

const getPublicUsers = async ({
  loggedInAs,
  filters,
}: {
  loggedInAs?: User
  filters?: PublicUsersFilters
}): Promise<PublicUser[]> => {
  const response = await queryPublicUsers({ loggedInAs, filters })

  expect(response.status).toBe(200)

  const body = await response.json()
  expect(body.errors).not.toBeDefined()

  const {
    data: { publicUsers },
  } = body

  return publicUsers
}

export default getPublicUsers
