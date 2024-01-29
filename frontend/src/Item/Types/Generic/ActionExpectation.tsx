import { Chip, differenceFromNow, formatDate, Grid, useTheme } from '@contag/ui'
import {
  ActionExpectation,
  ActionExpectationType,
  PublicUser,
} from 'src/generated/graphql'
import PublicUserAvatar from 'src/PublicUser/Avatar'

interface Props {
  actionExpectation: ActionExpectation
  to: PublicUser[]
}

const getCompleteUntilColor = (completeUntil: string | null | undefined) => {
  if (!completeUntil) {
    return undefined
  }

  const completeUntilInHoursFromNow = differenceFromNow(completeUntil, 'minute')

  if (completeUntilInHoursFromNow < 1) {
    return 'error'
  }

  if (completeUntilInHoursFromNow < 60 * 24) {
    return 'warning'
  }

  return 'success'
}

const Label = ({
  to,
  completeUntil,
}: {
  to: PublicUser[]
  completeUntil: string | null | undefined
}) => {
  const theme = useTheme()
  const by = completeUntil ? ` by ${formatDate(completeUntil)}` : ``

  if (to.length > 1) {
    return (
      <>
        Action expected by any one of {to.length}
        {to.map((user) => (
          <span
            key={user.id}
            style={{ display: 'inline-flex', padding: theme.spacing(0.5) }}
          >
            <PublicUserAvatar user={user} small inline />
          </span>
        ))}
        {by}
      </>
    )
  }

  if (to.length === 1) {
    const assignee = to[0]

    return (
      <>
        Action expected by
        <span style={{ display: 'inline-flex', padding: theme.spacing(0.5) }}>
          <PublicUserAvatar user={assignee} small inline />
        </span>
        {by}
      </>
    )
  }

  return <>Action expected{by}</>
}

const ActionExpectation = ({ actionExpectation, to }: Props) => {
  const theme = useTheme()

  if (actionExpectation.fulfilled === true) {
    return null
  }

  return (
    <Grid display='inline-flex' sx={{ flexShrink: 0 }}>
      <Chip
        aria-label='action expectation'
        label={
          <Label to={to} completeUntil={actionExpectation.completeUntil} />
        }
        color={
          actionExpectation.type === ActionExpectationType.ActionExpectedFromYou
            ? getCompleteUntilColor(actionExpectation.completeUntil)
            : undefined
        }
        variant={
          actionExpectation.type === ActionExpectationType.ActionExpected
            ? 'outlined'
            : undefined
        }
        sx={{
          '& .MuiChip-label': {
            minHeight: theme.spacing(4),
            lineHeight: theme.spacing(4),
            display: 'flex',
            alignItems: 'center',
          },
        }}
      />
    </Grid>
  )
}

export default ActionExpectation
