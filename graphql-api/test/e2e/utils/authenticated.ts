import { GraphQLError } from 'graphql'
import decodeToken from 'src/auth/decodeToken'
import type { User } from 'src/generated/graphql'
import type { LoggedInUser } from './factories/loggedInUser'
import loggedInUserFactory from './factories/loggedInUser'

jest.mock('firebase-admin/app')
jest.mock('src/auth/decodeToken')

const authenticatedUsers: LoggedInUser[] = []

beforeEach(() => {
  jest.mocked(decodeToken).mockImplementation(async (tokenHeader) => {
    const [_, token] = tokenHeader.split(' ')

    const authenticatedUser = authenticatedUsers.find(
      ({ email }) => token === email
    )

    if (!token || !authenticatedUser) {
      throw new GraphQLError('Unauthorized', {
        extensions: {
          code: 401,
          thrownFrom: 'tests',
        },
      })
    }

    return authenticatedUser
  })
})

const isLoggedInUser = (user: User | LoggedInUser): user is LoggedInUser => {
  if ('picture' in user) {
    return true
  }

  return false
}

type Authenticated = (user?: User | LoggedInUser) => { authorization: string }

const authenticated: Authenticated = (user = loggedInUserFactory.build()) => {
  const authenticatedUser: LoggedInUser = isLoggedInUser(user)
    ? user
    : {
        email: user.email,
        name: user.name,
        picture: user.photoURL as unknown as string,
      }

  if (
    !authenticatedUsers.find(({ email }) => authenticatedUser.email === email)
  ) {
    authenticatedUsers.push(authenticatedUser)
  }

  return {
    authorization: `Bearer ${authenticatedUser.email}`,
  }
}

export default authenticated
