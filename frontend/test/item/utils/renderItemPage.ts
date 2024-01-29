import userProfileFactory from 'test/factories/userProfile'
import mockGetItem from 'test/requestMocks/getItem'
import mockGetMyProfileRequest from 'test/requestMocks/getMyProfile'
import renderApp from 'test/utils/renderApp'

const renderItemPage = async ({
  id,
  myProfile = userProfileFactory.build(),
}: {
  id: string
  myProfile?: ReturnType<typeof userProfileFactory.build>
}) => {
  mockGetMyProfileRequest({ myProfile })

  const { requestInfo: getItemRequestInfo } = mockGetItem()

  const view = await renderApp({
    path: `/item/${id}`,
    loggedIn: true,
    loggedInUser: myProfile,
  })

  await view.waitFor(() => {
    expect(view.screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  return {
    myProfile,
    getItemRequestInfo,
    ...view,
  }
}

export default renderItemPage
