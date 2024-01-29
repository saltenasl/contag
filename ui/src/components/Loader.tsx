import { Box, CircularProgress } from '@mui/material'

const Loader = () => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <CircularProgress aria-label='Loading' />
  </Box>
)

export default Loader
