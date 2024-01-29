import { AppBar, Toolbar } from '@contag/ui'
import Home from './Home'
import Menu from './Menu'
import Search from './Search'

const TopBar = () => (
  <AppBar aria-label='top bar' position='fixed'>
    <Toolbar sx={{}}>
      <Home />
      <Search />
      <Menu />
    </Toolbar>
  </AppBar>
)

export default TopBar
