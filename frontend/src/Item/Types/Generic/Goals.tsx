import { useMutation } from '@apollo/client'
import {
  Button,
  Chip,
  CloseIcon,
  Grid,
  IconButton,
  SettingsIcon,
  Typography,
} from '@contag/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ItemGoalsInput from 'src/Item/Input/Goals'
import UPDATE_ITEM_GOALS from 'src/mutations/updateItemGoals'
import { Goal } from 'src/queries/getSearchItems'
import { getItemTextSummary } from '../Generic/utils'

interface Props {
  itemId: string
  goals: Goal[]
}

const Goals = ({ itemId, goals: initialGoals }: Props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [goals, setGoals] = useState(initialGoals)
  const navigate = useNavigate()

  const [updateGoals] = useMutation(UPDATE_ITEM_GOALS)

  return (
    <Grid>
      <Grid display='flex' sx={{ p: 0, justifyContent: 'space-between' }}>
        <Grid sx={{ p: 0 }}>
          <Typography
            variant='overline'
            sx={{ fontSize: '1rem' }}
            data-testid='goals-header'
          >
            Goals ({initialGoals.length})
          </Typography>
        </Grid>
        <Grid sx={{ p: 0, justifySelf: 'end' }}>
          {isEditing ? (
            <IconButton
              aria-label='stop editing goals'
              onClick={() => {
                setIsEditing(false)
                setGoals(initialGoals)
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label='edit goals'
              onClick={() => setIsEditing(true)}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {isEditing ? (
        <Grid sx={{ p: 0 }} display='flex' flexDirection='column'>
          <ItemGoalsInput values={goals} onChange={setGoals} />
          <Button
            onClick={() => {
              const goalsAdded = goals
                .filter(
                  (newGoal) =>
                    !initialGoals.some(
                      (existingGoal) => newGoal.id === existingGoal.id
                    )
                )
                .map(({ id }) => ({ id }))

              const goalsRemoved = initialGoals
                .filter(
                  (existingGoal) =>
                    !goals.some((newGoal) => existingGoal.id === newGoal.id)
                )
                .map(({ id }) => ({ id }))

              updateGoals({
                variables: {
                  itemId: itemId,
                  goalsAdded,
                  goalsRemoved,
                },
                onCompleted(data) {
                  if (data.updateItemGoals) {
                    setIsEditing(false)
                  }
                },
              })
            }}
          >
            Save goals
          </Button>
        </Grid>
      ) : (
        <Grid sx={{ p: 0 }}>
          {initialGoals.length === 0 ? 'none' : <></>}
          {initialGoals.map((goal) => (
            <Chip
              key={goal.id}
              data-testid={`goal-${goal.id}`}
              label={getItemTextSummary(goal).text}
              onClick={() => {
                navigate(`/item/${goal.id}`)
              }}
            />
          ))}
        </Grid>
      )}
    </Grid>
  )
}

export default Goals
