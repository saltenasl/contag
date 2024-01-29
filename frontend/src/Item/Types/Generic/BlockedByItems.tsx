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
import BlockedByItemsInput from 'src/Item/Input/BlockedByItems'
import UPDATE_ITEM_IS_BLOCKED_BY from 'src/mutations/updateItemIsBlockedBy'
import { Item } from 'src/queries/getSearchItems'
import { getItemTextSummary } from './utils'

interface Props {
  itemId: string
  blockedByItems: Item[]
}

const BlockedByItems = ({
  itemId,
  blockedByItems: initialBlockedByItems,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [blockedByItems, setBlockedByItems] = useState(initialBlockedByItems)
  const navigate = useNavigate()

  const [updateItemIsBlockedBy] = useMutation(UPDATE_ITEM_IS_BLOCKED_BY)

  return (
    <Grid>
      <Grid display='flex' sx={{ p: 0, justifyContent: 'space-between' }}>
        <Grid sx={{ p: 0 }}>
          <Typography
            variant='overline'
            sx={{ fontSize: '1rem' }}
            data-testid='blocked-by-items-header'
          >
            Blocked by ({initialBlockedByItems.length})
          </Typography>
        </Grid>
        <Grid sx={{ p: 0, justifySelf: 'end' }}>
          {isEditing ? (
            <IconButton
              aria-label='stop editing blocked by items'
              onClick={() => {
                setIsEditing(false)
                setBlockedByItems(initialBlockedByItems)
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label='edit blocked by items'
              onClick={() => setIsEditing(true)}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {isEditing ? (
        <Grid sx={{ p: 0 }} display='flex' flexDirection='column'>
          <BlockedByItemsInput
            values={blockedByItems}
            onChange={setBlockedByItems}
          />
          <Button
            onClick={() => {
              const blockedByAdded = blockedByItems
                .filter(
                  (newItem) =>
                    !initialBlockedByItems.some(
                      (existingItem) => newItem.id === existingItem.id
                    )
                )
                .map(({ id }) => ({ id }))

              const blockedByRemoved = initialBlockedByItems
                .filter(
                  (existingItem) =>
                    !blockedByItems.some(
                      (newItem) => existingItem.id === newItem.id
                    )
                )
                .map(({ id }) => ({ id }))

              updateItemIsBlockedBy({
                variables: {
                  itemId: itemId,
                  blockedByAdded,
                  blockedByRemoved,
                },
                onCompleted(data) {
                  if (data.updateItemIsBlockedBy) {
                    setIsEditing(false)
                  }
                },
              })
            }}
          >
            Save blocked by items
          </Button>
        </Grid>
      ) : (
        <Grid sx={{ p: 0 }}>
          {initialBlockedByItems.length === 0 ? 'none' : <></>}
          {initialBlockedByItems.map((blockedItem) => (
            <Chip
              key={blockedItem.id}
              data-testid={`blocked-by-item-${blockedItem.id}`}
              label={getItemTextSummary(blockedItem).text}
              onClick={() => {
                navigate(`/item/${blockedItem.id}`)
              }}
            />
          ))}
        </Grid>
      )}
    </Grid>
  )
}

export default BlockedByItems
