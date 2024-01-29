import React from 'react'
import {
  amberColor,
  Card,
  useTheme,
  limeColor,
  CardContent,
  Grid,
  tealColor,
  brownColor,
} from '..'

interface Props {
  active?: boolean
  isDropTarget?: boolean
  type: 'person' | 'message' | 'task' | 'question' | 'info' | 'goal'
  children: React.ReactElement | React.ReactElement[]
  onClick?: React.MouseEventHandler
}

const ItemCard = ({
  active = false,
  type,
  children,
  onClick,
  isDropTarget = false,
  ...rest
}: Props) => {
  const theme = useTheme()

  return (
    <Card
      raised={active}
      sx={{
        backgroundColor: isDropTarget ? theme.palette.grey[500] : undefined,
        cursor: onClick ? 'pointer' : undefined,
        borderRadius: 0,
        wordBreak: 'break-word',
        ...(type === 'task'
          ? {
              borderColor: amberColor[600],
              borderWidth: 1,
              borderStyle: 'solid',
            }
          : {}),
        ...(type === 'question'
          ? {
              borderColor: limeColor[600],
              borderWidth: 1,
              borderStyle: 'solid',
            }
          : {}),
        ...(type === 'info'
          ? {
              borderColor: tealColor[600],
              borderWidth: 1,
              borderStyle: 'solid',
            }
          : {}),
        ...(type === 'goal'
          ? {
              borderColor: brownColor[600],
              borderWidth: 1,
              borderStyle: 'solid',
            }
          : {}),
      }}
      onClick={onClick}
      {...rest}
    >
      <CardContent>
        <Grid container sx={{ flexDirection: 'column' }}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ItemCard
