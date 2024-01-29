import type { File, PrismaClient } from '@prisma/client'
import { GraphQLError } from 'graphql'
import type { Attachment } from 'src/generated/graphql'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import type { User } from 'src/types'

const validateAttachments = async ({
  attachments,
  currentAttachments = [],
  prisma,
  currentUser,
}: {
  attachments: Attachment[] | null | undefined
  currentAttachments?: File[]
  prisma: PrismaClient
  currentUser: User
}): Promise<{
  attachmentsAdded: File[]
  attachmentsRemoved: File[]
}> => {
  if (!attachments) {
    return { attachmentsAdded: [], attachmentsRemoved: [] }
  }

  const attachmentsAdded = attachments.filter(
    ({ id }) =>
      !currentAttachments.some(
        (currentAttachment) =>
          idFromGraphQLToPrisma(id) === currentAttachment.id
      )
  )

  const attachmentsRemoved = currentAttachments.filter(
    ({ id }) =>
      !attachments.some(
        (attachment) => id === idFromGraphQLToPrisma(attachment.id)
      )
  )

  const attachmentsAddedAndCreatedByCurrentUser = await prisma.file.findMany({
    where: {
      id: {
        in: attachmentsAdded.map(({ id }) => idFromGraphQLToPrisma(id)),
      },
      createdById: currentUser.id,
    },
  })

  if (
    attachmentsAdded.length !== attachmentsAddedAndCreatedByCurrentUser.length
  ) {
    throw new GraphQLError('Attachment(s) not found')
  }

  return {
    attachmentsAdded: attachmentsAddedAndCreatedByCurrentUser,
    attachmentsRemoved: attachmentsRemoved,
  }
}

export default validateAttachments
