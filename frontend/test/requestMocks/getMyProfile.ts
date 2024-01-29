import { faker } from '@faker-js/faker'
import { User } from 'src/generated/graphql'
import userProfileFactory from 'test/factories/userProfile'
import { mockRequest } from 'test/utils/mockRequest'

const mockGetMyProfileRequest = ({
  email = faker.internet.email(),
  myProfile = userProfileFactory.build({
    email,
  }),
}: {
  email?: string
  myProfile?: User
} = {}) => {
  const requestInfo = mockRequest('query', 'GetMyProfile', {
    myProfile,
  })

  return {
    myProfile,
    requestInfo,
  }
}

export default mockGetMyProfileRequest
