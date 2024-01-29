import { Auth } from 'firebase/auth'
import { graphql, GraphQLVariables } from 'msw'
import { setupServer } from 'msw/node'
import getAuth from 'src/auth/firebase'
import { Mutation, Query } from 'src/generated/graphql'

type MockGraphQLServer = ReturnType<typeof setupServer>

type Call = {
  requestVariables: GraphQLVariables
  responseData: Record<string, unknown>
}

export type MockedRequestInfo = {
  calledTimes: number
  calls: Call[]
}

export let server: MockGraphQLServer | null = null

beforeAll(() => {
  server = setupServer()

  server.listen({ onUnhandledRequest: 'error' })
})

jest.mock('src/auth/firebase')

const MOCKED_ACCESS_TOKEN = 'MOCKED-TEST-ACCESS-TOKEN'

beforeEach(() => {
  jest.mocked(getAuth).mockReturnValue({
    currentUser: {
      getIdToken: async () => MOCKED_ACCESS_TOKEN,
    },
  } as unknown as Auth)
})

afterEach(() => {
  server?.resetHandlers()
})

afterAll(() => {
  server?.close()
})

type ResponseResolverResult<T extends Query | Mutation> =
  | Partial<T>
  | ((variables: GraphQLVariables, request: MockedRequestInfo) => Partial<T>)

const getData = (
  result: ResponseResolverResult<Query | Mutation>,
  variables: GraphQLVariables,
  mockedRequestInfo: MockedRequestInfo
) => {
  if (typeof result === 'function') {
    return result(variables, mockedRequestInfo)
  }

  return result
}

export const mockRequest = <T extends 'query' | 'mutation'>(
  type: T,
  operationName: string,
  result: T extends 'query'
    ? ResponseResolverResult<Query>
    : ResponseResolverResult<Mutation>,
  { isAuthenticated = true, hangForever = false } = {}
): MockedRequestInfo => {
  const mockedRequestInfo: MockedRequestInfo = {
    calledTimes: 0,
    calls: [],
  }

  server?.use(
    graphql[type](operationName, (req, res, ctx) => {
      if (hangForever) {
        // I cannot do `return ctx.delay('infinite')` because that results in apollo not cancelling the query and therefore jest doesn't exit due to pending requests
        return
      }

      if (isAuthenticated) {
        const authorizationHeader = req.headers.get('authorization')

        if (
          !authorizationHeader ||
          authorizationHeader !== `Bearer ${MOCKED_ACCESS_TOKEN}`
        ) {
          const message = `Error resolving a mocked request! ${type} "${operationName}" doesn't contain a valid authorization header. Header value "${authorizationHeader}"`

          throw new Error(message)
        }
      }

      const data = getData(result, req.variables, mockedRequestInfo)

      mockedRequestInfo.calledTimes += 1
      mockedRequestInfo.calls.push({
        requestVariables: req.variables,
        responseData: data,
      })

      return res(ctx.data(data))
    })
  )

  return mockedRequestInfo
}
