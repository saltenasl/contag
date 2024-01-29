import { onError } from '@apollo/client/link/error'

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: "${message}", Location: "${locations}", Path: "${path}", operation: "${operation.operationName}"`
      )
    )
  }

  if (networkError) {
    console.error(
      `[Network error]: ${networkError} for operation "${operation.operationName}"`,
      networkError
    )
  }
})

export default errorLink
