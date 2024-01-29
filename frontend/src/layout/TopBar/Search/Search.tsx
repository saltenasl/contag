import {
  Box,
  SearchIcon,
  InputAdornment,
  TextField,
  useTheme,
  Popover,
} from '@contag/ui'
import { useEffect, useRef, useState } from 'react'
import useGetSearchResults from 'src/queries/getSearchResults'
import { useDebounce } from 'use-debounce'
import Results from './Results'

export const DEBOUNCE_SEARCH_MS = 200

const Search = () => {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, DEBOUNCE_SEARCH_MS)
  const [searchResultsOpen, setSearchResultsOpen] = useState(false)
  const searchFieldRef = useRef<HTMLDivElement | null>(null)

  const dontExecuteQuery = debouncedSearch === ''

  const { loading, items, publicUsers } = useGetSearchResults({
    search: debouncedSearch,
    skip: dontExecuteQuery,
  })

  useEffect(() => {
    setSearchResultsOpen(search !== '')
  }, [search])

  return (
    <Box
      data-testid='search-container'
      sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}
    >
      <TextField
        size='small'
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '4px',
        }}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
        }}
        onFocus={() => {
          if (debouncedSearch !== '' && !searchResultsOpen) {
            setSearchResultsOpen(true)
          }
        }}
        variant='outlined'
        inputProps={{
          'aria-label': 'search',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        ref={searchFieldRef}
      />

      <Popover
        open={searchResultsOpen}
        anchorEl={searchFieldRef.current}
        onClose={() => {
          setSearchResultsOpen(false)
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableRestoreFocus
        disablePortal
      >
        <Results
          items={items}
          loading={loading}
          onClose={() => setSearchResultsOpen(false)}
          publicUsers={publicUsers}
        />
      </Popover>
    </Box>
  )
}

export default Search
