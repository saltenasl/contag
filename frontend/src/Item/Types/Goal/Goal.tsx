import { Button, Chip, Grid, ItemCard, useTheme } from '@contag/ui'
import React, { useState } from 'react'
import { ItemType, GoalStatus } from 'src/generated/graphql'
import ItemForm from '../../Input/Form'
import SummaryForm from '../../Input/Summary/Form'
import Attachments from '../Generic/Attachments'
import ItemCardHeader from '../Generic/CardHeader'
import ChildCount from '../Generic/ChildCount'
import ItemSummary from '../Generic/Summary'
import ItemText from '../Generic/Text'
import { DndProps } from '../../Card'
import DragHandle from '../Generic/DragHandle'
import { useMutation } from '@apollo/client'
import AMEND_GOAL from 'src/mutations/amendGoal'
import Constituents from './Constituents'
import { Goal } from 'src/types'
import Goals from '../Generic/Goals'
import ItemsBlocked from '../Generic/ItemsBlocked'
import BlockedByItems from '../Generic/BlockedByItems'

type Props = {
  goal: Goal
  onClick: React.MouseEventHandler
  active?: boolean
  dnd?: DndProps
  detailed: boolean
}

const GoalItem = ({ goal, active, onClick, dnd, detailed }: Props) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [amendGoal] = useMutation(AMEND_GOAL)

  const convertGoalStatusTo =
    goal.goalStatus === GoalStatus.Todo ? GoalStatus.Done : GoalStatus.Todo

  return (
    <Grid key={goal.id} ref={dnd?.ref} {...dnd?.draggableProps}>
      <ItemCard
        type='goal'
        data-testid={`item-${goal.id}`}
        active={active}
        isDropTarget={dnd?.isDropTarget}
        onClick={onClick}
      >
        <ItemCardHeader
          item={goal}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSummarizing={isSummarizing}
          setIsSummarizing={setIsSummarizing}
        />

        <Constituents goalId={goal.id} constituents={goal.constituents ?? []} />

        {goal.goals ? <Goals itemId={goal.id} goals={goal.goals} /> : <></>}

        {goal.blocks && (detailed || goal.blocks.length > 0) ? (
          <ItemsBlocked itemId={goal.id} itemsBlocked={goal.blocks} />
        ) : (
          <></>
        )}

        {goal.blockedBy && (detailed || goal.blockedBy.length > 0) ? (
          <BlockedByItems itemId={goal.id} blockedByItems={goal.blockedBy} />
        ) : (
          <></>
        )}

        {isSummarizing ? (
          <SummaryForm
            item={goal}
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
            id={goal.id}
            initialText={{
              text: goal.text,
              richText: goal.richText,
            }}
            to={goal.to}
            sharedWith={goal.sharedWith}
            itemType={ItemType.Goal}
            stopEditing={() => {
              setIsEditing(false)
            }}
            actionExpectation={goal.actionExpectation}
            attachments={goal.attachments ?? []}
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
              <ItemSummary item={goal} isEditing={isSummarizing} />
              <ItemText item={goal} isEditing={isEditing} />
            </Grid>
            {dnd ? <DragHandle dragHandleProps={dnd.dragHandleProps} /> : null}
          </Grid>
        )}
        <Grid display='flex' sx={{ justifyContent: 'space-between' }}>
          <Grid>
            <Chip
              color={
                goal.goalStatus === GoalStatus.Todo ? 'secondary' : 'success'
              }
              label={`Status: ${goal.goalStatus}`}
            />
          </Grid>
          <Grid>
            {!isEditing ? (
              <Button
                variant='contained'
                onClick={(event) => {
                  event.stopPropagation()
                  amendGoal({
                    variables: {
                      input: {
                        id: goal.id,
                        goalStatus: convertGoalStatusTo,
                      },
                    },
                  })
                }}
              >
                Mark as {convertGoalStatusTo}
              </Button>
            ) : null}
          </Grid>
        </Grid>
        {!isEditing ? <Attachments item={goal} /> : <></>}
        <ChildCount item={goal} />
      </ItemCard>
    </Grid>
  )
}

export default GoalItem
