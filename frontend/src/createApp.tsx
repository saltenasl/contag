import { ThemeProvider } from '@contag/ui'
import { initializeApp } from 'firebase/app'
import {
  createBrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  from,
} from '@apollo/client'
import { AuthProvider } from './auth'
import routes from './routes'
import authLink from './apollo/links/auth'
import createHttpLink from './apollo/links/createHttp'
import { InviteToClient, Item, ObjectReference } from './generated/graphql'
import errorLink from './apollo/links/error'
import { useEffect } from 'react'
import PollContext from './PollContext'

const createApp = async ({
  path,
  isPollingEnabled = true,
}: { path?: string; isPollingEnabled?: boolean } = {}) => {
  const isRunningInTests = process.env.NODE_ENV === 'test'

  initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })

  const router = isRunningInTests
    ? createMemoryRouter(routes, { initialEntries: path ? [path] : [] })
    : createBrowserRouter(routes)

  const httpLink = await createHttpLink(window.fetch)

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        User: {
          fields: {
            clientInvites: {
              merge(existing: InviteToClient[], incoming: InviteToClient[]) {
                return incoming
              },
            },
          },
        },
        Message: {
          fields: {
            to: {
              merge(existing: ObjectReference[], incoming: ObjectReference[]) {
                return incoming
              },
            },
          },
        },
        Question: {
          fields: {
            to: {
              merge(existing: ObjectReference[], incoming: ObjectReference[]) {
                return incoming
              },
            },
          },
        },
        Task: {
          fields: {
            to: {
              merge(existing: ObjectReference[], incoming: ObjectReference[]) {
                return incoming
              },
            },
          },
        },
        Info: {
          fields: {
            to: {
              merge(existing: ObjectReference[], incoming: ObjectReference[]) {
                return incoming
              },
            },
          },
        },
        Query: {
          fields: {
            items: {
              merge(existing: Item[], incoming: Item[]) {
                return incoming
              },
            },
          },
        },
      },
    }),
    link: from([errorLink, authLink, httpLink]),
    connectToDevTools: !process.env.PROD,
  })

  const App = () => {
    useEffect(() => {
      return () => {
        apolloClient.stop()
      }
    }, [])

    return (
      <AuthProvider>
        <ThemeProvider>
          <ApolloProvider client={apolloClient}>
            <PollContext.Provider value={{ isPollingEnabled }}>
              <RouterProvider router={router} />
            </PollContext.Provider>
          </ApolloProvider>
        </ThemeProvider>
      </AuthProvider>
    )
  }

  return { App, router }
}

export default createApp
