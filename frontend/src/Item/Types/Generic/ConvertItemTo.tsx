import { useMutation } from '@apollo/client'
import { TypeName } from '@contag/graphql-api/src/constants'
import { IconButton, Menu, MenuItem, RedoIcon } from '@contag/ui'
import { useState } from 'react'
import cacheConvertItemFromQuestion from 'src/apollo/cache/item/convert/fromQuestion'
import cacheConvertItemToQuestion from 'src/apollo/cache/item/convert/toQuestion'
import cacheReplaceItemInFeed from 'src/apollo/cache/item/replace'
import { ItemType } from 'src/generated/graphql'
import CONVERT_ITEM from 'src/mutations/convertItem'
import { useItemsFeedContext } from '../../../Home/components/Feed/Items/Context'
import { isGoal, isInfo, isMessage, isQuestion, isTask, Item } from 'src/types'

interface Props {
  item: Item
}

const ConvertItemTo = ({ item }: Props) => {
  const feedContext = useItemsFeedContext()
  const [convertItem] = useMutation(CONVERT_ITEM)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    setAnchorEl(event.currentTarget)
  }

  const convertTo = (type: ItemType) => {
    convertItem({
      variables: {
        input: {
          to: type,
          itemId: item.id,
        },
      },
      update(cache, result) {
        if (result.data?.convertItem && feedContext) {
          cacheReplaceItemInFeed({
            cache,
            newItem: result.data.convertItem,
            oldItem: item,
            feedVariables: feedContext.variables,
          })

          if (
            item.__typename === TypeName.QUESTION &&
            type !== ItemType.Question
          ) {
            cacheConvertItemFromQuestion(cache, {
              childFeedVariables: feedContext.childFeedVariables,
              item: result.data?.convertItem,
            })
          }

          if (
            item.__typename !== TypeName.QUESTION &&
            type === ItemType.Question
          ) {
            cacheConvertItemToQuestion(cache, {
              childFeedVariables: feedContext.childFeedVariables,
              item: result.data?.convertItem,
            })
          }
        }
      },
    })
  }

  return (
    <>
      <IconButton
        id='convert-item-button'
        aria-label='convert item'
        aria-controls={open ? 'convert-item-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={openMenu}
      >
        <RedoIcon fontSize='small' />
      </IconButton>
      <Menu
        id='convert-item-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'convert-item-button',
        }}
      >
        <MenuItem
          onClick={(event) => {
            event.stopPropagation()
            convertTo(ItemType.Goal)
            closeMenu()
          }}
          disabled={isGoal(item)}
        >
          Convert to Goal
        </MenuItem>

        <MenuItem
          onClick={(event) => {
            event.stopPropagation()
            convertTo(ItemType.Info)
            closeMenu()
          }}
          disabled={isInfo(item)}
        >
          Convert to Info
        </MenuItem>

        <MenuItem
          onClick={(event) => {
            event.stopPropagation()
            convertTo(ItemType.Question)
            closeMenu()
          }}
          disabled={isQuestion(item)}
        >
          Convert to Question
        </MenuItem>

        <MenuItem
          onClick={(event) => {
            event.stopPropagation()
            convertTo(ItemType.Task)
            closeMenu()
          }}
          disabled={isTask(item)}
        >
          Convert to Task
        </MenuItem>

        <MenuItem
          onClick={(event) => {
            event.stopPropagation()
            convertTo(ItemType.Message)
            closeMenu()
          }}
          disabled={isMessage(item)}
        >
          Convert to Message
        </MenuItem>
      </Menu>
    </>
  )
}

export default ConvertItemTo
