import { Grid, useTheme } from '@contag/ui'
import { useEffect, useRef } from 'react'
import { scrollIntoViewOptions } from './constants'

const FeedContainer = ({
  id,
  children,
  scrollIntoViewOnMount,
}: {
  id: string
  children: React.ReactElement
  scrollIntoViewOnMount: boolean
}) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollIntoViewOnMount && containerRef.current) {
      containerRef.current.scrollIntoView(scrollIntoViewOptions)
    }
  }, [])

  return (
    <Grid
      container
      ref={containerRef}
      data-testid={`${id}-feed`}
      aria-label='feed'
      xs={10}
      sm={8}
      md={7}
      lg={5}
      xl={4}
      flexShrink={0}
      sx={{
        justifyContent: 'center',
        flexDirection: 'column',
        px: theme.spacing(2),
      }}
    >
      {children}
    </Grid>
  )
}

export default FeedContainer
