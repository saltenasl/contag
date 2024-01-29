import * as firebase from 'firebase-admin'

const removeAllAccessToFile = async ({ filename }: { filename: string }) => {
  const firestore = firebase.firestore()

  const doc = await firestore.doc(`/attachments/${filename}`).get()

  if (doc.exists) {
    await firestore.doc(`/attachments/${filename}`).delete()
  }
}

export default removeAllAccessToFile
