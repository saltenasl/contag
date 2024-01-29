import { useMutation } from '@apollo/client'
import { Button, Chip, Grid, ItemCard, useTheme } from '@contag/ui'
import React, { useState } from 'react'
import { ItemType, TaskStatus } from 'src/generated/graphql'
import AMEND_TASK from 'src/mutations/amendTask'
import ItemForm from '../Input/Form'
import SummaryForm from '../Input/Summary/Form'
import Attachments from './Generic/Attachments'
import ItemCardHeader from './Generic/CardHeader'
import ChildCount from './Generic/ChildCount'
import ItemSummary from './Generic/Summary'
import ItemText from './Generic/Text'
import { DndProps } from '../Card'
import DragHandle from './Generic/DragHandle'
import { Task } from 'src/types'
import Goals from './Generic/Goals'
import ItemsBlocked from './Generic/ItemsBlocked'
import BlockedByItems from './Generic/BlockedByItems'

type Props = {
  task: Task
  onClick: React.MouseEventHandler
  active?: boolean
  dnd?: DndProps
  detailed: boolean
}

const TaskItem = ({ task, active, onClick, dnd, detailed }: Props) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [amendTask] = useMutation(AMEND_TASK)

  const convertTaskStatusTo =
    task.status === TaskStatus.Todo ? TaskStatus.Done : TaskStatus.Todo

  return (
    <Grid key={task.id} ref={dnd?.ref} {...dnd?.draggableProps}>
      <ItemCard
        type='task'
        data-testid={`item-${task.id}`}
        active={active}
        isDropTarget={dnd?.isDropTarget}
        onClick={onClick}
      >
        <ItemCardHeader
          item={task}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSummarizing={isSummarizing}
          setIsSummarizing={setIsSummarizing}
        />

        {task.goals ? <Goals itemId={task.id} goals={task.goals} /> : <></>}

        {task.blocks && (detailed || task.blocks.length > 0) ? (
          <ItemsBlocked itemId={task.id} itemsBlocked={task.blocks} />
        ) : (
          <></>
        )}

        {task.blockedBy && (detailed || task.blockedBy.length > 0) ? (
          <BlockedByItems itemId={task.id} blockedByItems={task.blockedBy} />
        ) : (
          <></>
        )}

        {isSummarizing ? (
          <SummaryForm
            item={task}
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
            id={task.id}
            initialText={{
              text: task.text,
              richText: task.richText,
            }}
            to={task.to}
            sharedWith={task.sharedWith}
            itemType={ItemType.Task}
            stopEditing={() => {
              setIsEditing(false)
            }}
            actionExpectation={task.actionExpectation}
            attachments={task.attachments ?? []}
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
              <ItemSummary item={task} isEditing={isSummarizing} />
              <ItemText item={task} isEditing={isEditing} />
            </Grid>
            {dnd ? <DragHandle dragHandleProps={dnd.dragHandleProps} /> : null}
          </Grid>
        )}
        <Grid display='flex' sx={{ justifyContent: 'space-between' }}>
          <Grid>
            <Chip
              color={task.status === TaskStatus.Todo ? 'secondary' : 'success'}
              label={`Status: ${task.status}`}
            />
          </Grid>
          <Grid>
            {!isEditing ? (
              <Button
                variant='contained'
                onClick={(event) => {
                  event.stopPropagation()
                  amendTask({
                    variables: {
                      input: {
                        id: task.id,
                        status: convertTaskStatusTo,
                      },
                    },
                  })
                }}
              >
                Mark as {convertTaskStatusTo}
              </Button>
            ) : null}
          </Grid>
        </Grid>
        {!isEditing ? <Attachments item={task} /> : <></>}
        <ChildCount item={task} />
      </ItemCard>
    </Grid>
  )
}

export default TaskItem
