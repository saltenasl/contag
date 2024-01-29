import { getDownloadURL, getStorage, ref } from 'firebase/storage'

const getFileDownloadURL = async (filename: string) => {
  const storage = getStorage()

  return getDownloadURL(ref(storage, filename))
}

export default getFileDownloadURL
