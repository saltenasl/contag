import getAuth from './firebase'

const getToken = async () => {
  const token = getAuth().currentUser?.getIdToken()

  return token
}

export default getToken
