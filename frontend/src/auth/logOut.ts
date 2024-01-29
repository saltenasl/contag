import { getAuth, signOut } from 'firebase/auth'

const logOut = () => {
  const auth = getAuth()

  return signOut(auth)
}

export default logOut
