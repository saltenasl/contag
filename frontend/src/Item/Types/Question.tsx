import { Grid, ItemCard, useTheme, greenColor, CheckIcon } from '@contag/ui'
import React, { useState } from 'react'
import { ItemType } from 'src/generated/graphql'
import ItemForm from '../Input/Form'
import ChildCount from './Generic/ChildCount'
import ItemCardHeader from './Generic/CardHeader'
import SummaryForm from '../Input/Summary/Form'
import ItemText from './Generic/Text'
import ItemSummary from './Generic/Summary'
import Attachments from './Generic/Attachments'
import { DndProps } from '../Card'
import DragHandle from './Generic/DragHandle'
import { Question } from 'src/types'
import Goals from './Generic/Goals'
import ItemsBlocked from './Generic/ItemsBlocked'
import BlockedByItems from './Generic/BlockedByItems'
import RichTextRenderer from 'src/RichTextEditor/Components/RichTextEditor/RichTextRenderer'

type Props = {
  question: Question
  onClick: React.MouseEventHandler
  active?: boolean
  dnd?: DndProps
  detailed: boolean
}

const QuestionItem = ({ question, active, onClick, dnd, detailed }: Props) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)

  return (
    <Grid key={question.id} ref={dnd?.ref} {...dnd?.draggableProps}>
      <ItemCard
        type='question'
        data-testid={`item-${question.id}`}
        active={active}
        isDropTarget={dnd?.isDropTarget}
        onClick={onClick}
      >
        <ItemCardHeader
          item={question}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSummarizing={isSummarizing}
          setIsSummarizing={setIsSummarizing}
        />

        {question.goals ? (
          <Goals itemId={question.id} goals={question.goals} />
        ) : (
          <></>
        )}

        {question.blocks && (detailed || question.blocks.length > 0) ? (
          <ItemsBlocked itemId={question.id} itemsBlocked={question.blocks} />
        ) : (
          <></>
        )}

        {question.blockedBy && (detailed || question.blockedBy.length > 0) ? (
          <BlockedByItems
            itemId={question.id}
            blockedByItems={question.blockedBy}
          />
        ) : (
          <></>
        )}

        {isSummarizing ? (
          <SummaryForm
            item={question}
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
            id={question.id}
            initialText={{
              text: question.text,
              richText: question.richText,
            }}
            to={question.to}
            sharedWith={question.sharedWith}
            itemType={ItemType.Question}
            stopEditing={() => {
              setIsEditing(false)
            }}
            actionExpectation={question.actionExpectation}
            attachments={question.attachments ?? []}
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
              <ItemSummary item={question} isEditing={isSummarizing} />
              <ItemText item={question} isEditing={isEditing} />
            </Grid>
            {dnd ? <DragHandle dragHandleProps={dnd.dragHandleProps} /> : null}
          </Grid>
        )}
        {question.acceptedAnswer ? (
          <Grid
            aria-label='accepted answer'
            container
            sx={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: greenColor[600],
              alignItems: 'center',
              m: theme.spacing(1),
              p: theme.spacing(1),
              whiteSpace: 'pre-line',
            }}
          >
            <CheckIcon
              color='success'
              sx={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
              }}
            />
            <RichTextRenderer
              text={question.acceptedAnswer.text}
              richText={question.acceptedAnswer.richText}
            />
          </Grid>
        ) : (
          <></>
        )}
        {!isEditing ? <Attachments item={question} /> : <></>}
        <ChildCount item={question} />
      </ItemCard>
    </Grid>
  )
}

export default QuestionItem
