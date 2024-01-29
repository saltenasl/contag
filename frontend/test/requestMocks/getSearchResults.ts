import {
  Item,
  PublicUser,
  GetSearchResultsQueryVariables,
} from 'src/generated/graphql'
import { mockRequest } from 'test/utils/mockRequest'
import equal from 'deep-equal'

type MockedRequest = {
  items: Item[]
  publicUsers: PublicUser[]
  input?: GetSearchResultsQueryVariables
}

let mockedRequests: MockedRequest[] = []

afterEach(() => {
  mockedRequests = []
})

const mockGetSearchResults = ({ items, publicUsers, input }: MockedRequest) => {
  mockedRequests.push({ items, publicUsers, input })

  const requestInfo = mockRequest('query', 'GetSearchResults', (variables) => {
    const mockedRequest =
      mockedRequests.find(({ input }) => equal(variables, input)) ||
      mockedRequests.find(({ input }) => input === undefined) // when there's a mocked request with no input it's used as an escape-hatch

    if (!mockedRequest) {
      console.error(
        `Mocked request for GetSearchResults query with variables "${JSON.stringify(
          variables,
          undefined,
          2
        )}" not found!`
      )

      return {}
    }

    const { items } = mockedRequest

    return { items, publicUsers }
  })

  return {
    requestInfo,
  }
}

export default mockGetSearchResults
