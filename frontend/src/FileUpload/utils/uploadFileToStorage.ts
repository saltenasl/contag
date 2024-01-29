import { getStorage, ref, uploadBytes } from 'firebase/storage'

const uploadFileToStorage = async (filename: string, file: File) => {
  const storage = getStorage()
  await uploadBytes(ref(storage, filename), file)
}

export default uploadFileToStorage
