import {
  Box,
  Loader,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  useTheme,
} from '@contag/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserFeedURL } from 'src/Home/components/HomePage'
import DenseItem from 'src/Item/Types/Generic/DenseItem'
import useGetSearchResults from 'src/queries/getSearchResults'

interface Props {
  items: ReturnType<typeof useGetSearchResults>['items']
  loading: ReturnType<typeof useGetSearchResults>['loading']
  publicUsers: ReturnType<typeof useGetSearchResults>['publicUsers']
  onClose: () => void
}

const tabA11yProps = (index: number) => ({
  id: `results-tab-${index}`,
  'aria-controls': `results-tabpanel-${index}`,
})

interface TabPanelProps {
  children?: React.ReactNode
  myIndex: number
  openTabIndex: number
}

const TabPanel = ({
  children,
  openTabIndex,
  myIndex,
  ...other
}: TabPanelProps) =>
  openTabIndex === myIndex ? (
    <div
      role='tabpanel'
      id={`results-tabpanel-${myIndex}`}
      aria-labelledby={`results-tab-${myIndex}`}
      {...other}
    >
      <Box sx={{ p: 3 }}>{children}</Box>
    </div>
  ) : (
    <></>
  )

const Results = ({ items, loading, onClose, publicUsers }: Props) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [openTabIndex, changeOpenTabIndex] = useState(0)

  if (loading || !items || !publicUsers) {
    return <Loader />
  }

  return (
    <Grid aria-label='results' sx={{ width: theme.spacing(100) }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={openTabIndex}
          onChange={(_, newValue) => changeOpenTabIndex(newValue)}
        >
          <Tab
            data-testid='items-tab-header'
            label={`Items (${items.length})`}
            {...tabA11yProps(0)}
          />
          <Tab
            data-testid='users-tab-header'
            label={`Users (${publicUsers.length})`}
            {...tabA11yProps(0)}
          />
        </Tabs>
      </Box>
      <TabPanel
        openTabIndex={openTabIndex}
        myIndex={0}
        data-testid='items-tab-content'
      >
        {items.length === 0 ? (
          'No results'
        ) : (
          <Stack spacing={1}>
            {items.map((item) => (
              <DenseItem
                onClick={() => {
                  navigate(`/item/${item.id}`)
                  onClose()
                }}
                key={item.id}
                item={item}
              />
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel
        openTabIndex={openTabIndex}
        myIndex={1}
        data-testid='users-tab-content'
      >
        {publicUsers.length === 0 ? (
          'No results'
        ) : (
          <Stack spacing={1}>
            {publicUsers.map((user) => (
              <Paper
                key={user.id}
                data-testid={`user-${user.id}-summary`}
                aria-label='user summary'
                onClick={() => {
                  // this fn is untested
                  navigate(getUserFeedURL(user.id))
                  onClose()
                }}
                sx={{
                  ':hover': {
                    backgroundColor: theme.palette.grey[500],
                  },
                  cursor: 'pointer',
                }}
              >
                {user.name}
              </Paper>
            ))}
          </Stack>
        )}
      </TabPanel>
    </Grid>
  )
}

export default Results
