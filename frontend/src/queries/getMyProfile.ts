import { useQuery } from '@apollo/client'
import { gql } from 'src/generated'
import { useIsPollingEnabled } from 'src/PollContext'

export const POLL_PROFILE_INTERVAL = 10000

export const GET_MY_PROFILE = gql(`
  query GetMyProfile {
    myProfile {
      id
      email
      name
      photoURL
      clients {
        id
        name
        role
        addedBy {
          name
          email
        }
      }
      clientInvites {
        id
        client {
          id
          name
        }
        email
      }
    }
  }
`)

const useGetMyProfileQuery = () => {
  const isPollingEnabled = useIsPollingEnabled()

  const { client, data, loading, error } = useQuery(GET_MY_PROFILE, {
    pollInterval: isPollingEnabled ? POLL_PROFILE_INTERVAL : undefined,
  })

  return { client, myProfile: data?.myProfile, loading, error }
}

export default useGetMyProfileQuery
