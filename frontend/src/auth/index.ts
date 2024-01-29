import { User } from 'firebase/auth'
import { useContext } from 'react'
import AuthContext, { Provider as AuthProvider } from './components/Context'
import LoginPage from './components/LoginPage'
import getToken from './getToken'
import logOut from './logOut'

const useAuth = () => useContext(AuthContext)

export type { User }

export { useAuth, AuthProvider, LoginPage, logOut, getToken }
