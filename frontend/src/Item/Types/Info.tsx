import { useMutation } from '@apollo/client'
import { Button, Chip, Grid, ItemCard, useTheme } from '@contag/ui'
import React, { useState } from 'react'
import { ItemType } from 'src/generated/graphql'
import AMEND_INFO from 'src/mutations/amendInfo'
import ItemForm from '../Input/Form'
import SummaryForm from '../Input/Summary/Form'
import Attachments from './Generic/Attachments'
import ItemCardHeader from './Generic/CardHeader'
import ChildCount from './Generic/ChildCount'
import ItemSummary from './Generic/Summary'
import ItemText from './Generic/Text'
import { DndProps } from '../Card'
import DragHandle from './Generic/DragHandle'
import { Info } from 'src/types'
import Goals from './Generic/Goals'
import ItemsBlocked from './Generic/ItemsBlocked'
import BlockedByItems from './Generic/BlockedByItems'

type Props = {
  info: Info
  onClick: React.MouseEventHandler
  active?: boolean
  dnd?: DndProps
  detailed: boolean
}

const InfoItem = ({ info, active, onClick, dnd, detailed }: Props) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const [amendInfo] = useMutation(AMEND_INFO)

  return (
    <Grid key={info.id} ref={dnd?.ref} {...dnd?.draggableProps}>
      <ItemCard
        type='info'
        data-testid={`item-${info.id}`}
        active={active}
        isDropTarget={dnd?.isDropTarget}
        onClick={onClick}
      >
        <ItemCardHeader
          item={info}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSummarizing={isSummarizing}
          setIsSummarizing={setIsSummarizing}
        />

        {info.goals ? <Goals itemId={info.id} goals={info.goals} /> : <></>}

        {info.blocks && (detailed || info.blocks.length > 0) ? (
          <ItemsBlocked itemId={info.id} itemsBlocked={info.blocks} />
        ) : (
          <></>
        )}

        {info.blockedBy && (detailed || info.blockedBy.length > 0) ? (
          <BlockedByItems itemId={info.id} blockedByItems={info.blockedBy} />
        ) : (
          <></>
        )}

        {isSummarizing ? (
          <SummaryForm
            item={info}
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
            id={info.id}
            initialText={{
              text: info.text,
              richText: info.richText,
            }}
            to={info.to}
            sharedWith={info.sharedWith}
            itemType={ItemType.Info}
            stopEditing={() => {
              setIsEditing(false)
            }}
            actionExpectation={info.actionExpectation}
            attachments={info.attachments ?? []}
          />
        ) : (
          <Grid
            container
            sx={{
              p: theme.spacing(1),
              flexDirection: 'row',
              flexWrap: 'nowrap',
            }}
          >
            <Grid display='flex' sx={{ flexGrow: 1, flexDirection: 'column' }}>
              <ItemSummary item={info} isEditing={isSummarizing} />
              <ItemText item={info} isEditing={isEditing} />
            </Grid>
            {dnd ? <DragHandle dragHandleProps={dnd.dragHandleProps} /> : null}
          </Grid>
        )}
        <Grid display='flex' sx={{ justifyContent: 'space-between' }}>
          <Grid>
            {info.acknowledged ? (
              <Chip color='success' label='Acknowledged' />
            ) : null}
          </Grid>
          <Grid>
            {!info.acknowledged && !isEditing ? (
              <Button
                variant='contained'
                onClick={(event) => {
                  event.stopPropagation()
                  amendInfo({
                    variables: {
                      input: {
                        id: info.id,
                        acknowledged: true,
                      },
                    },
                  })
                }}
              >
                Acknowledge
              </Button>
            ) : null}
          </Grid>
        </Grid>
        {!isEditing ? <Attachments item={info} /> : <></>}
        <ChildCount item={info} />
      </ItemCard>
    </Grid>
  )
}

export default InfoItem
