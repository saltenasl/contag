import { Loader, Grid, Toolbar } from '@contag/ui'
import React from 'react'
import { useAuth } from 'src/auth'
import TopBar from './TopBar'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, user } = useAuth()

  return (
    <Grid container>
      {user && <TopBar />}
      <Grid
        container
        component='main'
        sx={{ flexDirection: 'column', flexGrow: 1, flexWrap: 'nowrap' }}
      >
        {
          user && (
            <Toolbar />
          ) /* Empty toolbar which takes the exact height TopBar takes */
        }
        {isLoading ? <Loader /> : children}
      </Grid>
    </Grid>
  )
}

export default Layout
