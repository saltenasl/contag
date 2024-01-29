import { Avatar, AccountCircleIcon, Badge, useTheme } from '@contag/ui'
import { ReactElement } from 'react'
import { PublicUser } from 'src/generated/graphql'

const withActivityBadge = (item: ReactElement) => (
  <Badge
    aria-label='user is active'
    color='success'
    badgeContent={' '}
    overlap='circular'
  >
    {item}
  </Badge>
)

const PublicUserAvatar = ({
  user,
  small = false,
  inline = false,
}: {
  user: PublicUser
  small?: boolean
  inline?: boolean
}) => {
  const { photoURL, name, active } = user
  const theme = useTheme()

  const avatar = photoURL ? (
    <Avatar
      alt={name ?? undefined}
      src={photoURL}
      aria-label={`${name || ''} avatar`}
      sx={{
        ...(small ? { width: theme.spacing(3), height: theme.spacing(3) } : {}),
        ...(inline ? { display: 'inline-flex' } : {}),
      }}
    />
  ) : (
    <AccountCircleIcon
      aria-label={`${name || ''} avatar`}
      sx={{
        ...(small ? { width: theme.spacing(3), height: theme.spacing(3) } : {}),
        ...(inline ? { display: 'inline-flex' } : {}),
      }}
    />
  )

  if (active) {
    return withActivityBadge(avatar)
  }

  return avatar
}

export default PublicUserAvatar
