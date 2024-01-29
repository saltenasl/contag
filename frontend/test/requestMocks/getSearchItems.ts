import { Item, SearchItemsQueryVariables } from 'src/generated/graphql'
import { mockRequest } from 'test/utils/mockRequest'
import equal from 'deep-equal'

type MockedRequest = {
  items: Item[]
  input?: SearchItemsQueryVariables
}

let mockedRequests: MockedRequest[] = []

afterEach(() => {
  mockedRequests = []
})

const mockGetSearchItems = ({ items, input }: MockedRequest) => {
  mockedRequests.push({ items, input })

  const requestInfo = mockRequest('query', 'SearchItems', (variables) => {
    const mockedRequest =
      mockedRequests.find(({ input }) => equal(variables, input)) ||
      mockedRequests.find(({ input }) => input === undefined) // when there's a mocked request with no input it's used as an escape-hatch

    if (!mockedRequest) {
      console.error(
        `Mocked request for SearchItems query with variables "${JSON.stringify(
          variables,
          undefined,
          2
        )}" not found!`
      )

      return {}
    }

    const { items } = mockedRequest

    return { items }
  })

  return {
    requestInfo,
  }
}

export default mockGetSearchItems
