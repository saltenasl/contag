import { Loader, Stack } from '@contag/ui'
import useGetChildrenItems from 'src/queries/getChildren'
import DenseItem from './DenseItem'

interface Props {
  parentId: string
}

const ChildrenSummary = ({ parentId }: Props) => {
  const { loading, children } = useGetChildrenItems(parentId)

  if (loading || !children) {
    return (
      <Stack aria-label='children summary'>
        <Loader />
      </Stack>
    )
  }

  return (
    <Stack aria-label='children summary' spacing={1}>
      {children.map((item) => (
        <DenseItem key={item.id} item={item} />
      ))}
    </Stack>
  )
}

export default ChildrenSummary
