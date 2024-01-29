import type { File } from '@prisma/client'
import type { GenericItem, UserWithoutIncludes } from 'src/types'
import allowUserAccessToFile from './allowUserAccessToFile'
import removeAllAccessToFile from './removeAllAccessToFile'
import removeUserAccessToFile from './removeUserAccessToFile'

const alterAuthorizationForUpdatedItemsAttachments = ({
  item,
  attachmentsAdded,
  attachmentsRemoved,
  addedSharedWithUsers,
  removedSharedWithUsers,
}: {
  item: GenericItem
  attachmentsAdded: File[]
  attachmentsRemoved: File[]
  addedSharedWithUsers: UserWithoutIncludes[]
  removedSharedWithUsers: UserWithoutIncludes[]
}) => {
  attachmentsAdded.forEach(({ filename }) => {
    item.sharedWith.forEach(({ user: { email } }) => {
      allowUserAccessToFile({
        operations: ['read'],
        userEmail: email,
        filename,
      })
    })
  })

  addedSharedWithUsers.forEach(({ email: userEmail }) => {
    item.attachments.forEach(({ filename }) => {
      allowUserAccessToFile({
        operations: ['read'],
        userEmail,
        filename,
      })
    })
  })

  removedSharedWithUsers.forEach(({ email: userEmail }) => {
    item.attachments.forEach(({ filename }) => {
      removeUserAccessToFile({ filename, userEmail })
    })
  })

  attachmentsRemoved.forEach(({ filename }) => {
    removeAllAccessToFile({ filename })
  })
}

export default alterAuthorizationForUpdatedItemsAttachments
