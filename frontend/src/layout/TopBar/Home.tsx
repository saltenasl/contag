import { IconButton, HomeIcon } from '@contag/ui'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <IconButton
      edge='start'
      color='inherit'
      aria-label='home'
      onClick={() => navigate('/')}
    >
      <HomeIcon />
    </IconButton>
  )
}

export default Home
