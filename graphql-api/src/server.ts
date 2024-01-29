import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga'
import resolvers from './resolvers'
import fs from 'node:fs'
import path from 'node:path'
import {
  EmailAddressTypeDefinition,
  DateTimeTypeDefinition,
  URLTypeDefinition,
} from 'graphql-scalars'
import { PrismaClient } from '@prisma/client'
import { initializeApp } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { GraphQLError } from 'graphql'
import decodeToken from './auth/decodeToken'
import type { Context } from './types'
import upsertUser from './dal/user/upsert'

export const GRAPHQL_ENDPOINT = '/'

const schemaDefinition = fs.readFileSync(
  path.resolve(__dirname, './schema.graphql'),
  {
    encoding: 'utf8',
  }
)

const schema = createSchema({
  typeDefs: [
    EmailAddressTypeDefinition,
    DateTimeTypeDefinition,
    URLTypeDefinition,
    schemaDefinition,
  ],
  resolvers,
})

const prisma = new PrismaClient()

initializeApp({
  credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
})

// eslint-disable-next-line @typescript-eslint/ban-types
export const yoga = createYoga<{}, Context>({
  schema,
  landingPage: false,
  graphqlEndpoint: GRAPHQL_ENDPOINT,
  maskedErrors: process.env['NODE_ENV'] === 'production',
  async context({ request, params }) {
    const tokenHeader = request.headers.get('authorization')

    if (!tokenHeader) {
      throw new GraphQLError('Unauthorized', {
        extensions: {
          code: 401,
        },
      })
    }
    const { email, picture, name } = await decodeToken(tokenHeader)

    const user = await upsertUser({ email, picture, name, prisma })

    return {
      request,
      params,
      prisma,
      user,
    }
  },
})

// @ts-expect-error this fails due to "exactOptionalPropertyTypes" compiler option being enabled
//  this is the suggested way of creating http server for yoga so it shouldn't break and i don't
//  want to disable option just to satisfy the compiler in this single place.
const server = createServer(yoga)

export default server
