import { Ref } from 'react'
import {
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from 'react-beautiful-dnd'
import { isGoal, isInfo, isMessage, isQuestion, isTask, Item } from 'src/types'
import GoalItem from './Types/Goal'
import InfoItem from './Types/Info'
import MessageItem from './Types/Message'
import QuestionItem from './Types/Question'
import TaskItem from './Types/Task'

export interface DndProps {
  isDropTarget: boolean
  ref: Ref<HTMLDivElement>
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined
}

interface Props {
  item: Item
  active?: boolean
  onClick?: () => void
  dnd?: DndProps
  detailed?: boolean
}

const ItemCard = ({
  item,
  dnd,
  active,
  onClick = () => {},
  detailed = false,
}: Props) => {
  if (isMessage(item)) {
    return (
      <MessageItem
        active={active}
        message={item}
        onClick={onClick}
        dnd={dnd}
        detailed={detailed}
      />
    )
  }

  if (isTask(item)) {
    return (
      <TaskItem
        active={active}
        task={item}
        onClick={onClick}
        dnd={dnd}
        detailed={detailed}
      />
    )
  }

  if (isQuestion(item)) {
    return (
      <QuestionItem
        active={active}
        question={item}
        onClick={onClick}
        dnd={dnd}
        detailed={detailed}
      />
    )
  }

  if (isInfo(item)) {
    return (
      <InfoItem
        active={active}
        info={item}
        onClick={onClick}
        dnd={dnd}
        detailed={detailed}
      />
    )
  }

  if (isGoal(item)) {
    return (
      <GoalItem
        active={active}
        goal={item}
        onClick={onClick}
        dnd={dnd}
        detailed={detailed}
      />
    )
  }

  return <></>
}

export default ItemCard
