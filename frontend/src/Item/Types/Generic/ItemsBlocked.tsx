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
import ItemsBlockedInput from 'src/Item/Input/ItemsBlocked'
import UPDATE_ITEMS_BLOCKED from 'src/mutations/updateItemsBlocked'
import { Item } from 'src/queries/getSearchItems'
import { getItemTextSummary } from './utils'

interface Props {
  itemId: string
  itemsBlocked: Item[]
}

const ItemsBlocked = ({ itemId, itemsBlocked: initialItemsBlocked }: Props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [itemsBlocked, setItemsBlocked] = useState(initialItemsBlocked)
  const navigate = useNavigate()

  const [updateItemsBlocked] = useMutation(UPDATE_ITEMS_BLOCKED)

  return (
    <Grid>
      <Grid display='flex' sx={{ p: 0, justifyContent: 'space-between' }}>
        <Grid sx={{ p: 0 }}>
          <Typography
            variant='overline'
            sx={{ fontSize: '1rem' }}
            data-testid='items-blocked-header'
          >
            Blocks ({initialItemsBlocked.length})
          </Typography>
        </Grid>
        <Grid sx={{ p: 0, justifySelf: 'end' }}>
          {isEditing ? (
            <IconButton
              aria-label='stop editing items blocked'
              onClick={() => {
                setIsEditing(false)
                setItemsBlocked(initialItemsBlocked)
              }}
            >
              <CloseIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label='edit items blocked'
              onClick={() => setIsEditing(true)}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      {isEditing ? (
        <Grid sx={{ p: 0 }} display='flex' flexDirection='column'>
          <ItemsBlockedInput values={itemsBlocked} onChange={setItemsBlocked} />
          <Button
            onClick={() => {
              const itemsBlockedAdded = itemsBlocked
                .filter(
                  (newItem) =>
                    !initialItemsBlocked.some(
                      (existingItem) => newItem.id === existingItem.id
                    )
                )
                .map(({ id }) => ({ id }))

              const itemsBlockedRemoved = initialItemsBlocked
                .filter(
                  (existingItem) =>
                    !itemsBlocked.some(
                      (newItem) => existingItem.id === newItem.id
                    )
                )
                .map(({ id }) => ({ id }))

              updateItemsBlocked({
                variables: {
                  itemId: itemId,
                  itemsBlockedAdded,
                  itemsBlockedRemoved,
                },
                onCompleted(data) {
                  if (data.updateItemsBlocked) {
                    setIsEditing(false)
                  }
                },
              })
            }}
          >
            Save items blocked
          </Button>
        </Grid>
      ) : (
        <Grid sx={{ p: 0 }}>
          {initialItemsBlocked.length === 0 ? 'none' : <></>}
          {initialItemsBlocked.map((blockedItem) => (
            <Chip
              key={blockedItem.id}
              data-testid={`blocked-item-${blockedItem.id}`}
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

export default ItemsBlocked
