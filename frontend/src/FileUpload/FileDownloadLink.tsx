import { useEffect, useState } from 'react'
import { Link } from '@contag/ui'
import type { File as GraphQLFile } from 'src/generated/graphql'
import getFileDownloadURL from './utils/getFileDownloadURL'

type Props = { file: GraphQLFile }

const FileDownloadLink = ({ file }: Props) => {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    getFileDownloadURL(file.filename).then(setUrl)
  }, [file.filename])

  if (!url) {
    return <>{file.originalName}</>
  }

  return (
    <Link
      href={url}
      target='_blank'
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      {file.originalName}
    </Link>
  )
}

export default FileDownloadLink
