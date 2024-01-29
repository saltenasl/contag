import { Grid, ItemCard, useTheme } from '@contag/ui'
import React, { useState } from 'react'
import ItemForm from '../Input/Form'
import ChildCount from './Generic/ChildCount'
import ItemCardHeader from './Generic/CardHeader'
import SummaryForm from '../Input/Summary/Form'
import ItemText from './Generic/Text'
import ItemSummary from './Generic/Summary'
import Attachments from './Generic/Attachments'
import { DndProps } from '../Card'
import DragHandle from './Generic/DragHandle'
import { Message } from 'src/types'
import Goals from './Generic/Goals'
import ItemsBlocked from './Generic/ItemsBlocked'
import BlockedByItems from './Generic/BlockedByItems'

type Props = {
  message: Message
  onClick: React.MouseEventHandler
  active?: boolean
  dnd?: DndProps
  detailed: boolean
}

const MessageItem = ({ message, active, onClick, dnd, detailed }: Props) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)

  return (
    <Grid key={message.id} ref={dnd?.ref} {...dnd?.draggableProps}>
      <ItemCard
        type='message'
        data-testid={`item-${message.id}`}
        active={active}
        isDropTarget={dnd?.isDropTarget}
        onClick={onClick}
      >
        <ItemCardHeader
          item={message}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSummarizing={isSummarizing}
          setIsSummarizing={setIsSummarizing}
        />

        {message.goals ? (
          <Goals itemId={message.id} goals={message.goals} />
        ) : (
          <></>
        )}

        {message.blocks && (detailed || message.blocks.length > 0) ? (
          <ItemsBlocked itemId={message.id} itemsBlocked={message.blocks} />
        ) : (
          <></>
        )}

        {message.blockedBy && (detailed || message.blockedBy.length > 0) ? (
          <BlockedByItems
            itemId={message.id}
            blockedByItems={message.blockedBy}
          />
        ) : (
          <></>
        )}

        {isSummarizing ? (
          <SummaryForm
            item={message}
            stopSummarizing={() => {
              setIsSummarizing(false)
            }}
          />
        ) : (
          <></>
        )}
        {isEditing ? (
          <ItemForm
            isEditing={true}
            id={message.id}
            initialText={{
              text: message.text,
              richText: message.richText,
            }}
            to={message.to}
            sharedWith={message.sharedWith}
            stopEditing={() => {
              setIsEditing(false)
            }}
            actionExpectation={null}
            attachments={message.attachments ?? []}
          />
        ) : (
          <></>
        )}
        <Grid
          container
          sx={{
            p: theme.spacing(1),
            flexDirection: 'row',
            flexWrap: 'nowrap',
          }}
        >
          <Grid
            display='flex'
            sx={{
              flexGrow: 1,
              flexDirection: 'column',
            }}
          >
            <ItemSummary item={message} isEditing={isSummarizing} />
            <ItemText item={message} isEditing={isEditing} />
          </Grid>
          {dnd ? <DragHandle dragHandleProps={dnd.dragHandleProps} /> : null}
        </Grid>
        {!isEditing ? <Attachments item={message} /> : <></>}
        <ChildCount item={message} />
      </ItemCard>
    </Grid>
  )
}

export default MessageItem
