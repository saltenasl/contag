import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import getAuth from '../firebase'

const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })
  provider.addScope('https://www.googleapis.com/auth/userinfo.email')
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile')

  return signInWithPopup(getAuth(), provider)
}

export default loginWithGoogle
