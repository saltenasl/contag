import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: './src/schema.graphql',
  config: {
    scalars: {
      EmailAddress: 'string',
      DateTime: 'Date',
      URL: 'URL',
      JSONObject: 'Object',
    },
  },
  generates: {
    'src/generated/graphql.ts': {
      config: {
        contextType: 'src/types#Context',
        defaultMapper: 'DeepPartial<{T}>',
      },
      plugins: [
        'typescript',
        'typescript-resolvers',
        'typescript-operations',
        { add: { content: "import { DeepPartial } from 'utility-types';" } },
      ],
    },
  },
}

export default config
