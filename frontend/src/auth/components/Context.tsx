import { onAuthStateChanged, User } from 'firebase/auth'
import { createContext, useEffect, useState } from 'react'
import getAuth from '../firebase'

type Auth =
  | { isLoading: true; user?: never }
  | { isLoading?: never; user: null | User }

const Context = createContext<Auth>({ isLoading: true })

export const Provider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<Auth>({ isLoading: true })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        setAuthState({ user: null })

        return
      }

      setAuthState({ user })
    })

    return unsubscribe
  }, [])

  return <Context.Provider value={authState}>{children}</Context.Provider>
}

export default Context
