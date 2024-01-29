import { Button, Typography, Box, GoogleIcon } from '@contag/ui'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '..'
import { NAVIGATE_TO_POST_AUTH_PARAM } from '../constants'
import loginWithGoogle from '../login/withGoogle'

const LoginPage = () => {
  const { user } = useAuth()
  const [URLSearchParams] = useSearchParams()

  if (user) {
    const navigateTo = URLSearchParams.get(NAVIGATE_TO_POST_AUTH_PARAM)
    if (navigateTo) {
      return <Navigate to={decodeURIComponent(navigateTo)} />
    }

    return <Navigate to={'/'} />
  }

  return (
    <Box>
      <Typography variant='h3'>Start using Contag!</Typography>
      <Button
        variant='contained'
        startIcon={<GoogleIcon />}
        onClick={loginWithGoogle}
      >
        Log in with Google
      </Button>
    </Box>
  )
}

export default LoginPage
