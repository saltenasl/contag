import { PublicUser, User } from 'src/generated/graphql'
import publicUserFactory from 'test/factories/publicUser'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetMyProfileRequest from 'test/requestMocks/getMyProfile'
import mockGetPublicUsers from 'test/requestMocks/getPublicUsers'
import renderApp from 'test/utils/renderApp'

const render = async ({
  numberOfRecipients = 2,
  myProfile = userProfileFactory.build(),
  recipients = publicUserFactory.buildList(numberOfRecipients),
  isPollingEnabled = false,
  includeSelfInPersonFeed = true,
}: {
  numberOfRecipients?: number
  myProfile?: User
  recipients?: PublicUser[]
  isPollingEnabled?: boolean
  includeSelfInPersonFeed?: boolean
} = {}) => {
  mockGetMyProfileRequest({ myProfile })

  const publicUsers = includeSelfInPersonFeed
    ? [userToPublicUser(myProfile), ...recipients]
    : [...recipients]

  const { requestInfo: getFeedRequestInfo } = mockGetPublicUsers(publicUsers)

  const view = await renderApp({
    loggedIn: true,
    loggedInUser: myProfile,
    isPollingEnabled,
  })

  return {
    myProfile,
    recipients,
    getFeedRequestInfo,
    ...view,
  }
}

export default render
