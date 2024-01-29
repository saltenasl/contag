import type {
  GenericMutationResponse,
  NestItemInput,
  User,
} from 'src/generated/graphql'
import authenticated from '../../utils/authenticated'
import request from '../../utils/request'

export const mutateNestItem = ({
  input,
  loggedInAs,
}: {
  input: NestItemInput
  loggedInAs: User
}) => {
  return request(
    `#graphql
    mutation NestItem($input: NestItemInput!) {
      nestItem(input: $input) {
        success
        message
      }
    }`,
    {
      variables: { input },
      headers: authenticated(loggedInAs),
    }
  )
}

const nestItem = async ({
  input,
  loggedInAs,
}: {
  input: NestItemInput
  loggedInAs: User
}): Promise<GenericMutationResponse> => {
  const response = await mutateNestItem({
    input,
    loggedInAs,
  })

  expect(response.status).toBe(200)

  const {
    data: { nestItem: result },
    errors,
  } = await response.json()

  expect(errors).not.toBeDefined()

  return result
}

export default nestItem
