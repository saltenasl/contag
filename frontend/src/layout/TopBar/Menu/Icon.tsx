import { Avatar, Badge, AccountCircleIcon } from '@contag/ui'

interface Props {
  photoURL?: string | null
  name?: string | null
  notificationCount?: number
}

const Icon = ({ photoURL, name, notificationCount }: Props) => {
  if (!photoURL) {
    return <AccountCircleIcon aria-label='empty profile picture' />
  }

  return (
    <Badge
      badgeContent={notificationCount}
      color='secondary'
      data-testid='menu-icon-badge'
      showZero={false}
      aria-label={
        notificationCount && notificationCount === 1
          ? `${notificationCount} new notification`
          : `${notificationCount} new notifications`
      }
    >
      <Avatar alt={name ?? undefined} src={photoURL} aria-label='my avatar' />
    </Badge>
  )
}

export default Icon
