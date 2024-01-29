import { setContext } from '@apollo/client/link/context'
import { getToken } from 'src/auth'

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken()

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export default authLink
