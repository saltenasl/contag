import { faker } from '@faker-js/faker'
import { initializeApp } from 'firebase/app'
import {
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { LOGIN_URL, NAVIGATE_TO_POST_AUTH_PARAM } from 'src/auth/constants'
import userFactory from './factories/user'
import mockGetMyProfileRequest from './requestMocks/getMyProfile'
import renderApp from './utils/renderApp'
import getAuth from 'src/auth/firebase'
import mockGetPublicUsers from './requestMocks/getPublicUsers'

jest.mock('firebase/auth')
jest.mock('firebase/app')

describe('authentication', () => {
  it('initializes firebase app', async () => {
    await renderApp({ dontMockAuthContext: true })

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  })

  describe('while retrieving auth state from firebase', () => {
    beforeEach(() => {
      jest.mocked(onAuthStateChanged).mockImplementation(() => {
        return () => {}
      })
    })

    it('renders loader when in public route', async () => {
      const { screen } = await renderApp({
        dontMockAuthContext: true,
        path: LOGIN_URL,
      })

      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('renders loader when in protected route', async () => {
      const { screen } = await renderApp({
        dontMockAuthContext: true,
        path: '/',
      })

      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })
  })

  describe('not authenticated', () => {
    beforeEach(() => {
      jest.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        if (typeof callback === 'function') {
          callback(null)
        }

        return () => {}
      })
    })

    it('renders authentication page', async () => {
      const { screen } = await renderApp({ dontMockAuthContext: true })

      expect(screen.getByText('Start using Contag!')).toBeInTheDocument()
      expect(screen.getByText('Log in with Google')).toBeInTheDocument()
    })

    it('calls firebase on login button click', async () => {
      const auth = {}
      jest.mocked(getAuth).mockReturnValue(auth as Auth)

      const { screen, userEvent } = await renderApp({
        dontMockAuthContext: true,
      })

      await userEvent.click(screen.getByText('Log in with Google'))

      expect(GoogleAuthProvider).toHaveBeenCalled()

      const googleAuthProviderInstance =
        jest.mocked(GoogleAuthProvider).mock.instances[0]
      expect(googleAuthProviderInstance.addScope).toHaveBeenCalledWith(
        'https://www.googleapis.com/auth/userinfo.email'
      )
      expect(googleAuthProviderInstance.addScope).toHaveBeenCalledWith(
        'https://www.googleapis.com/auth/userinfo.profile'
      )

      expect(signInWithPopup).toHaveBeenCalledWith(
        auth,
        googleAuthProviderInstance
      )
    })
  })

  describe('authenticated', () => {
    beforeEach(() => {
      jest.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        if (typeof callback === 'function') {
          callback(userFactory.build())
        }

        return () => {}
      })

      mockGetPublicUsers()
      mockGetMyProfileRequest()
    })

    it('renders log out option', async () => {
      const { screen, userEvent } = await renderApp({
        dontMockAuthContext: true,
      })

      const menu = screen.getByLabelText('menu')
      expect(menu).toBeInTheDocument()

      await userEvent.click(menu)

      expect(screen.getByText('Log Out')).toBeInTheDocument()
    })

    it('logs out', async () => {
      jest.mocked(signOut).mockImplementation(async () => {})

      const { screen, userEvent } = await renderApp({
        dontMockAuthContext: true,
      })

      await userEvent.click(screen.getByLabelText('menu'))

      await userEvent.click(screen.getByText('Log Out'))

      expect(signOut).toHaveBeenCalled()
    })

    it(`navigates to ?${NAVIGATE_TO_POST_AUTH_PARAM} if it is provided`, async () => {
      const path = '/random-page'
      const search = `?x=${faker.random.word()}`
      const hash = `#${faker.random.word()}`
      const navigateTo = encodeURIComponent(`${path}${search}${hash}`)

      const { getLocation } = await renderApp({
        dontMockAuthContext: true,
        path: `${LOGIN_URL}?${NAVIGATE_TO_POST_AUTH_PARAM}=${navigateTo}`,
      })

      expect(getLocation()).toStrictEqual(
        expect.objectContaining({
          pathname: path,
          search,
          hash,
        })
      )
    })

    it(`navigates to "/" when ${NAVIGATE_TO_POST_AUTH_PARAM} query param is not provided`, async () => {
      const { getLocation } = await renderApp({
        dontMockAuthContext: true,
        path: `${LOGIN_URL}`,
      })

      expect(getLocation()).toStrictEqual(
        expect.objectContaining({
          pathname: '/',
        })
      )
    })
  })
})
