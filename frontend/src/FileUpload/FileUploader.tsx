import { useEffect, useMemo, useState } from 'react'
import {
  CircularProgress,
  DeleteIcon,
  Grid,
  IconButton,
  List,
  ListItem,
  useTheme,
} from '@contag/ui'
import { useMutation } from '@apollo/client'
import CREATE_FILE from 'src/mutations/createFile'
import type { File as GraphQLFile } from 'src/generated/graphql'
import FileDownloadLink from './FileDownloadLink'
import uploadFileToStorage from './utils/uploadFileToStorage'

enum FileUploadStatus {
  IN_PROGRESS,
  FINISHED,
  FAILED,
}

type FileUploadFinished = {
  status: FileUploadStatus.FINISHED
  referenceId: string
  name: string
  file: GraphQLFile
}

type FileUpload =
  | {
      status: FileUploadStatus.FAILED | FileUploadStatus.IN_PROGRESS
      referenceId: string
      name: string
    }
  | FileUploadFinished

type Props = {
  onChange: (files: GraphQLFile[]) => void
  onHasUploadsPendingChange?: (hasUploadsPending: boolean) => void
  files: GraphQLFile[]
}

const FileUploader = ({
  onChange,
  files,
  onHasUploadsPendingChange,
}: Props) => {
  const theme = useTheme()
  const [unfinishedFileUploads, setUnfinishedFileUploads] = useState<
    FileUpload[]
  >([])
  const [createFile] = useMutation(CREATE_FILE)

  const freshlyFinishedUploads = useMemo(
    () =>
      unfinishedFileUploads
        .filter(
          (fileUpload): fileUpload is FileUploadFinished =>
            fileUpload.status === FileUploadStatus.FINISHED
        )
        .map(({ file }) => file),
    [unfinishedFileUploads]
  )

  const hasUploadsPending = useMemo(
    () =>
      unfinishedFileUploads.some(
        ({ status }) => status === FileUploadStatus.IN_PROGRESS
      ),
    [unfinishedFileUploads]
  )

  const fileUploads: FileUpload[] = [
    ...files.map((file) => ({
      status: FileUploadStatus.FINISHED,
      referenceId: file.id,
      name: file.originalName,
      file,
    })),
    ...unfinishedFileUploads,
  ]

  useEffect(() => {
    if (onHasUploadsPendingChange) {
      onHasUploadsPendingChange(hasUploadsPending)
    }
  }, [hasUploadsPending])

  useEffect(() => {
    onChange([...files, ...freshlyFinishedUploads])
  }, [onChange, freshlyFinishedUploads])

  const startUploadingFile = ({
    referenceId,
    name,
  }: {
    referenceId: string
    name: string
  }) => {
    setUnfinishedFileUploads((files) => [
      ...files,
      {
        status: FileUploadStatus.IN_PROGRESS,
        referenceId,
        name,
      },
    ])
  }

  const fileUploadFinished = ({
    referenceId,
    file,
  }: {
    referenceId: string
    file: GraphQLFile
  }) => {
    onChange([...files, file])

    setUnfinishedFileUploads((files) =>
      files.filter((file) => referenceId !== file.referenceId)
    )
  }

  const fileUploadFailed = (referenceId: string) => {
    setUnfinishedFileUploads((files) =>
      files.map((file) => {
        if (file.referenceId === referenceId) {
          return {
            ...file,
            status: FileUploadStatus.FAILED,
          }
        }

        return file
      })
    )
  }

  const uploadFile = async (file: File) => {
    const referenceId = `${Math.floor(Math.random() * 100000)}` // todo - this needs to be more secure against clashes in the referenceId, however i haven't found a quick way to make nanoid work in jsdom test env so resorted to this
    startUploadingFile({ name: file.name, referenceId })

    createFile({
      variables: {
        input: {
          contentType: file.type,
          originalName: file.name,
          size: file.size,
        },
      },
      async onCompleted(data) {
        if (data.createFile) {
          try {
            await uploadFileToStorage(data.createFile.filename, file)

            fileUploadFinished({ referenceId, file: data.createFile })
          } catch (error) {
            console.warn('file upload failed', error)

            fileUploadFailed(referenceId)
          }
          return
        }

        console.warn("createFile mutation didn't return a file")
      },
    })
  }

  const deleteFileUpload = (fileUpload: FileUpload) => {
    if (fileUpload.status === FileUploadStatus.FINISHED) {
      onChange(files.filter(({ id }) => id !== fileUpload.file.id))

      return
    }
  }

  return (
    <Grid>
      <List dense>
        {fileUploads.map((fileUpload) => (
          <ListItem
            aria-label='upload'
            key={fileUpload.referenceId}
            sx={{
              color:
                fileUpload.status === FileUploadStatus.FAILED
                  ? theme.palette.error.main
                  : undefined,
            }}
            secondaryAction={
              <IconButton
                edge='end'
                aria-label={`delete ${fileUpload.name}`}
                onClick={() => deleteFileUpload(fileUpload)}
                disabled={fileUpload.status !== FileUploadStatus.FINISHED}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            {fileUpload.status === FileUploadStatus.FINISHED ? (
              <FileDownloadLink file={fileUpload.file} />
            ) : (
              <>
                {fileUpload.status === FileUploadStatus.IN_PROGRESS ? (
                  <CircularProgress aria-label='uploading' />
                ) : null}
                {fileUpload.name}
              </>
            )}
          </ListItem>
        ))}
      </List>
      <Grid>
        <input
          aria-label='upload attachment'
          type='file'
          multiple
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              Array.from(event.target.files).forEach((file) => {
                uploadFile(file)
              })
            }
          }}
        />
      </Grid>
    </Grid>
  )
}

export default FileUploader
