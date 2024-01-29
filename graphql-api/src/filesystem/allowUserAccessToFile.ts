import * as firebase from 'firebase-admin'

const allowUserAccessToFile = async ({
  operations,
  userEmail,
  filename,
}: {
  operations: ('read' | 'write')[]
  userEmail: string
  filename: string
}) => {
  if (operations.length === 0 || operations.length > 2) {
    throw new Error('0 or more than 2 operations provided')
  }

  const firestore = firebase.firestore()

  await Promise.all(
    operations.map(async (operation) => {
      const doc = await firestore
        .doc(`/attachments/${filename}/${operation}/${userEmail}`)
        .get()

      if (!doc.exists) {
        await firestore
          .doc(`/attachments/${filename}/${operation}/${userEmail}`)
          .create({})
      }
    })
  )
}

export default allowUserAccessToFile
