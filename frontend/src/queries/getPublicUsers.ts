import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { useIsPollingEnabled } from 'src/PollContext'

export const POLL_PUBLIC_USERS_INTERVAL = 3000

export const GET_PUBLIC_USERS = gql(`
  query GetPublicUsers {
    publicUsers {
      id
      email
      name
      photoURL
      active
    }
  }`)

const useGetPublicUsers = () => {
  const isPollingEnabled = useIsPollingEnabled()

  const { client, data, loading, error } = useQuery(GET_PUBLIC_USERS, {
    pollInterval: isPollingEnabled ? POLL_PUBLIC_USERS_INTERVAL : undefined,
  })

  return { client, publicUsers: data?.publicUsers, loading, error }
}

export default useGetPublicUsers
