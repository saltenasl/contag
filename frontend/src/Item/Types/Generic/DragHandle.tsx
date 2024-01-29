import { DragHandleIcon, Grid } from '@contag/ui'
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd'

interface Props {
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined
}

const DragHandle = ({ dragHandleProps }: Props) => (
  <Grid
    sx={{ flexShrink: 0, cursor: 'grab' }}
    {...dragHandleProps}
    aria-label='drag handle'
  >
    <DragHandleIcon />
  </Grid>
)

export default DragHandle
