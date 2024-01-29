import { createHttpLink as apolloCreateHttpLink } from '@apollo/client'

const createHttpLink = async (fetch: WindowOrWorkerGlobalScope['fetch']) => {
  const httpLink = apolloCreateHttpLink({
    uri: process.env.GRAPHQL_API_URL,
    fetch,
  })

  return httpLink
}

export default createHttpLink
