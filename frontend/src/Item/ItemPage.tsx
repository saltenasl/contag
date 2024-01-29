import { useQuery } from '@apollo/client'
import { Loader, Grid, useTheme } from '@contag/ui'
import { useParams } from 'react-router-dom'
import GET_ITEM from 'src/queries/getItem'
import ItemCard from './Card'

const ItemPage = () => {
  const theme = useTheme()
  const { id } = useParams()
  const { loading, data } = useQuery(GET_ITEM, { variables: { id: id ?? '' } })

  if (loading || !data?.item) {
    return <Loader />
  }

  return (
    <Grid container direction='column' sx={{ m: theme.spacing(2) }} spacing={2}>
      <ItemCard item={data.item} detailed />
    </Grid>
  )
}

export default ItemPage
