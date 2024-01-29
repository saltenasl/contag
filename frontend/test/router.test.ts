import { LOGIN_URL, NAVIGATE_TO_POST_AUTH_PARAM } from 'src/auth/constants'
import mockGetMyProfileRequest from './requestMocks/getMyProfile'
import mockGetPublicUsers from './requestMocks/getPublicUsers'
import renderApp from './utils/renderApp'

describe('router', () => {
  it('renders unprotected route', async () => {
    const { screen } = await renderApp({ loggedIn: false, path: LOGIN_URL })

    expect(screen.getByText('Start using Contag!')).toBeInTheDocument()
  })

  describe('protected routes', () => {
    it(`redirects to /login?${NAVIGATE_TO_POST_AUTH_PARAM}= when user is unauthenticated`, async () => {
      const path = '/'

      const { screen, getLocation } = await renderApp({ loggedIn: false, path })

      expect(screen.getByText('Start using Contag!')).toBeInTheDocument()
      expect(getLocation()).toStrictEqual(
        expect.objectContaining({
          pathname: LOGIN_URL,
          search: `?${NAVIGATE_TO_POST_AUTH_PARAM}=${encodeURIComponent(path)}`,
        })
      )
    })

    it('shows page if user is authenticated', async () => {
      mockGetMyProfileRequest()
      mockGetPublicUsers()

      const { screen, waitFor } = await renderApp({ loggedIn: true })

      expect(screen.getByLabelText('menu')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument() // feed finishes loading
      })
    })
  })
})
