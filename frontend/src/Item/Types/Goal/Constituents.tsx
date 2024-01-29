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
import GoalConstituentsInput from 'src/Item/Input/Goal/Constituents'
import UPDATE_GOAL_CONSTITUENTS from 'src/mutations/updateGoalConstituents'
import { Item } from 'src/queries/getSearchItems'
import { getItemTextSummary } from '../Generic/utils'

interface Props {
  goalId: string
  constituents: Item[]
}

const Constituents = ({ goalId, constituents: initialConstituents }: Props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [constituents, setConstituents] = useState(initialConstituents)
  const navigate = useNavigate()

  const [updateConstituents] = useMutation(UPDATE_GOAL_CONSTITUENTS)

  return (
    <Grid>
      <Grid display='flex' sx={{ p: 0, justifyContent: 'space-between' }}>
        <Grid sx={{ p: 0 }}>
          <Typography variant='overline' sx={{ fontSize: '1rem' }}>
            Constituents
          </Typography>
        </Grid>
        <Grid sx={{ p: 0, justifySelf: 'end' }}>
          {isEditing ? (
            <IconButton
              aria-label='stop editing constituents'
              onClick={() => {
                setIsEditing(false)
                setConstituents(initialConstituents)
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label='edit constituents'
              onClick={() => setIsEditing(true)}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {isEditing ? (
        <Grid sx={{ p: 0 }} display='flex' flexDirection='column'>
          <GoalConstituentsInput
            values={constituents}
            onChange={setConstituents}
          />
          <Button
            onClick={() => {
              const constituentsAdded = constituents
                .filter(
                  (newConstituent) =>
                    !initialConstituents.some(
                      (existingConstituent) =>
                        newConstituent.id === existingConstituent.id
                    )
                )
                .map(({ id }) => ({ id }))

              const constituentsRemoved = initialConstituents
                .filter(
                  (existingConstituent) =>
                    !constituents.some(
                      (newConstituent) =>
                        existingConstituent.id === newConstituent.id
                    )
                )
                .map(({ id }) => ({ id }))

              updateConstituents({
                variables: {
                  itemId: goalId,
                  constituentsAdded,
                  constituentsRemoved,
                },
                onCompleted(data) {
                  if (data.updateGoalConstituents) {
                    setIsEditing(false)
                  }
                },
              })
            }}
          >
            Save constituents
          </Button>
        </Grid>
      ) : (
        <Grid sx={{ p: 0 }}>
          {initialConstituents.length === 0 ? 'none' : <></>}
          {initialConstituents.map((constituent) => (
            <Chip
              key={constituent.id}
              label={getItemTextSummary(constituent).text}
              data-testid={`constituent-${constituent.id}`}
              onClick={() => {
                navigate(`/item/${constituent.id}`)
              }}
            />
          ))}
        </Grid>
      )}
    </Grid>
  )
}

export default Constituents
