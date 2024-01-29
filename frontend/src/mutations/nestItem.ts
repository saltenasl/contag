import { gql } from 'src/generated'

const NEST_ITEM = gql(`
  mutation NestItem($input: NestItemInput!) {
    nestItem(input: $input) {
      success
    }
  }`)

export default NEST_ITEM
