import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getIdToken, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth'
import createApp from 'src/createApp'
import userFactory from 'test/factories/user'
import { User } from 'src/auth'

jest.mock('firebase/auth')

const mockAuthContext = (user: User | null) => {
  jest.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
    if (typeof callback === 'function') {
      callback(user)
    }

    return () => {}
  })

  jest.mocked(onIdTokenChanged).mockImplementation(() => {
    // id token never changes in tests
    return () => {}
  })

  jest.mocked(getIdToken).mockResolvedValue('mocked-api-token')
}

const renderApp = async ({
  loggedIn = false,
  loggedInUser = {},
  dontMockAuthContext = false,
  path = '/',
  isPollingEnabled = false,
}: {
  loggedIn?: boolean
  loggedInUser?: Partial<User>
  dontMockAuthContext?: boolean
  path?: string
  isPollingEnabled?: boolean
} = {}) => {
  const user = loggedIn ? userFactory.build(loggedInUser) : null
  if (!dontMockAuthContext) {
    mockAuthContext(user)
  }

  const { App, router } = await createApp({ path, isPollingEnabled })

  const view = render(<App />)

  return {
    ...view,
    screen,
    userEvent,
    within,
    waitFor,
    getLocation: () => router.state.location,
    loggedInUser: user,
  }
}

export default renderApp
