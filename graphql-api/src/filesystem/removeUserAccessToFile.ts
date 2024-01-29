import * as firebase from 'firebase-admin'

const removeUserAccessToFile = async ({
  filename,
  userEmail,
}: {
  filename: string
  userEmail: string
}) => {
  const firestore = firebase.firestore()

  const path = `/attachments/${filename}/read/${userEmail}`

  const doc = await firestore.doc(path).get()

  if (doc.exists) {
    await firestore.doc(path).delete()
  }
}

export default removeUserAccessToFile
