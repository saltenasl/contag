import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from 'src/auth'
import { LOGIN_URL, NAVIGATE_TO_POST_AUTH_PARAM } from 'src/auth/constants'

const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
  const { isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <></>
  }

  if (user) {
    return element
  }

  return (
    <Navigate
      to={`${LOGIN_URL}?${NAVIGATE_TO_POST_AUTH_PARAM}=${encodeURIComponent(
        `${location.pathname}${location.search}${location.hash}`
      )}`}
    />
  )
}

const protectedRoute = ({
  element,
  path,
}: {
  element: JSX.Element
  path: string
}) => ({
  path,
  element: <ProtectedRoute element={element} />,
})

export default protectedRoute
