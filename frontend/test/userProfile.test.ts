import { POLL_PROFILE_INTERVAL } from 'src/queries/getMyProfile'
import mockGetMyProfileRequest from './requestMocks/getMyProfile'
import mockGetPublicUsers from './requestMocks/getPublicUsers'
import renderApp from './utils/renderApp'

describe('user profile', () => {
  beforeEach(() => {
    mockGetPublicUsers()
  })

  describe('photoURL', () => {
    it('displays it as menu icon if present', async () => {
      const { myProfile } = mockGetMyProfileRequest()

      const { screen, within } = await renderApp({
        loggedIn: true,
        loggedInUser: myProfile,
      })

      const menuAvatarIcon = await screen.findByLabelText('my avatar')
      expect(menuAvatarIcon).toBeInTheDocument()

      expect(within(menuAvatarIcon).getByRole('img')).toHaveAttribute(
        'src',
        myProfile.photoURL
      )
      // @ts-expect-error name is always defined
      expect(screen.getByAltText(myProfile.name)).toBeInTheDocument()
    })
  })

  describe('polling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    it(`profile is re-fetched every ${POLL_PROFILE_INTERVAL}ms`, async () => {
      const { myProfile, requestInfo } = mockGetMyProfileRequest()

      const { screen, waitFor } = await renderApp({
        loggedIn: true,
        loggedInUser: myProfile,
        isPollingEnabled: true,
      })

      expect(await screen.findByLabelText('my avatar')).toBeInTheDocument()
      expect(requestInfo.calledTimes).toBe(1)

      jest.advanceTimersByTime(POLL_PROFILE_INTERVAL)

      await waitFor(() => {
        expect(requestInfo.calledTimes).toBe(2)
      })

      jest.advanceTimersByTime(POLL_PROFILE_INTERVAL)

      await waitFor(() => {
        expect(requestInfo.calledTimes).toBe(3)
      })
    })
  })
})
