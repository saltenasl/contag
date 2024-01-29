import { RouteObject } from 'react-router-dom'
import { LoginPage } from 'src/auth'
import { LOGIN_URL } from 'src/auth/constants'
import { ClientsPage } from 'src/clients'
import { CLIENTS_PAGE_URL } from 'src/clients/constants'
import HomePage from 'src/Home/components/HomePage'
import ItemPage from 'src/Item/ItemPage'
import Layout from 'src/layout/Layout'
import RichTextEditorDummyPage from 'src/RichTextEditor/Components/DummyPage'
import protectedRoute from './components/protectedRoute'

const routes: RouteObject[] = [
  { path: LOGIN_URL, element: <LoginPage /> },
  protectedRoute({ path: '/', element: <HomePage /> }),
  protectedRoute({ path: CLIENTS_PAGE_URL, element: <ClientsPage /> }),
  protectedRoute({ path: '/item/:id', element: <ItemPage /> }),
  protectedRoute({ path: '/editor', element: <RichTextEditorDummyPage /> }),
  { path: '*', element: <>Page Not Found!</> },
].map(({ element, ...rest }) => ({
  ...rest,
  element: <Layout>{element}</Layout>,
}))

export default routes
