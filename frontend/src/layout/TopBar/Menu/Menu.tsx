import { Badge, IconButton, Menu as MenuComponent, MenuItem } from '@contag/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logOut } from 'src/auth'
import { CLIENTS_PAGE_URL } from 'src/clients/constants'
import useGetMyProfileQuery from 'src/queries/getMyProfile'
import Icon from './Icon'

const Menu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { client, myProfile } = useGetMyProfileQuery()
  const navigate = useNavigate()

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const photoURL = myProfile?.photoURL
  const name = myProfile?.name
  const notificationCount = myProfile ? myProfile.clientInvites.length : 0

  return (
    <div>
      <IconButton
        edge='end'
        size='large'
        aria-label='menu'
        aria-controls='menu-appbar'
        aria-haspopup='true'
        onClick={openMenu}
        color='inherit'
      >
        <Icon
          photoURL={photoURL}
          name={name}
          notificationCount={notificationCount}
        />
      </IconButton>
      <MenuComponent
        id='menu-appbar'
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            navigate(CLIENTS_PAGE_URL)
          }}
        >
          <Badge
            badgeContent={notificationCount}
            color='secondary'
            data-testid='invites-menu-item-badge'
            showZero={false}
            aria-label={
              notificationCount && notificationCount === 1
                ? `open to see ${notificationCount} new notification`
                : `open to see ${notificationCount} new notifications`
            }
          >
            Clients
          </Badge>
        </MenuItem>
        <MenuItem
          onClick={() => {
            logOut().then(() => {
              client.stop()
              client.resetStore()
            })
          }}
        >
          Log Out
        </MenuItem>
      </MenuComponent>
    </div>
  )
}

export default Menu
