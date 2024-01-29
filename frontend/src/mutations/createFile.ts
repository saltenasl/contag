import { gql } from 'src/generated'

const CREATE_FILE = gql(`
mutation CreateFile($input: CreateFileInput!) {
  createFile(input: $input) {
    id
    filename
    originalName
    contentType
    size
  }
}`)

export default CREATE_FILE
