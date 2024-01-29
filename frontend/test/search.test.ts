import { faker } from '@faker-js/faker'
import { act } from 'react-dom/test-utils'
import { CLIENTS_PAGE_URL } from 'src/clients/constants'
import { SEARCH_ITEMS_SORT } from 'src/queries/getSearchResults'
import topBarDriver from './drivers/topBar'
import messageFactory from './factories/message'
import publicUserFactory from './factories/publicUser'
import mockGetMyProfileRequest from './requestMocks/getMyProfile'
import mockGetSearchResults from './requestMocks/getSearchResults'
import renderApp from './utils/renderApp'
import { DEBOUNCE_SEARCH_MS } from 'src/layout/TopBar/Search/Search'

const render = async () => {
  const { myProfile } = mockGetMyProfileRequest()

  const utils = await renderApp({
    loggedIn: true,
    path: CLIENTS_PAGE_URL, // CLIENTS_PAGE_URL is used since it's one of the least api request heavy pages
    loggedInUser: myProfile,
  })

  return utils
}

describe('search', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('search with no results', async () => {
    const { requestInfo } = mockGetSearchResults({ items: [], publicUsers: [] })

    const { container, waitFor } = await render()
    const searchTerm = faker.lorem.word()

    expect(requestInfo.calledTimes).toBe(0)

    const searchDriver = await waitFor(() => topBarDriver(container).search())

    searchDriver.results.areNotVisible()
    expect(searchDriver.input.getValue()).toBe('')

    await searchDriver.input.setTerm(searchTerm)
    await act(() => {
      jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS)
    })

    expect(searchDriver.input.getValue()).toBe(searchTerm)

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual({
      itemsFilters: { search: searchTerm },
      publicUsersFilters: { search: searchTerm },
      itemsSort: SEARCH_ITEMS_SORT,
    })

    searchDriver.results.areVisible()
    expect(searchDriver.results.itemsTab.isActive).toBe(true)
    expect(searchDriver.results.itemsTab.header.text).toBe(`Items (0)`)
    expect(searchDriver.results.itemsTab.content.text).toBe('No results')
    expect(searchDriver.results.itemsTab.content.listItemsText()).toStrictEqual(
      []
    )

    expect(searchDriver.results.usersTab.isActive).toBe(false)
    await searchDriver.results.usersTab.header.click()
    expect(searchDriver.results.usersTab.isActive).toBe(true)
    expect(searchDriver.results.usersTab.header.text).toBe(`Users (0)`)
    expect(searchDriver.results.usersTab.content.text).toBe('No results')
    expect(searchDriver.results.usersTab.content.listItemsText()).toStrictEqual(
      []
    )
  })

  it('search with results', async () => {
    const searchTerm = faker.lorem.word()
    const items = messageFactory.buildList(2)
    const publicUsers = publicUserFactory.buildList(2)
    mockGetSearchResults({
      items,
      publicUsers,
      input: {
        itemsFilters: { search: searchTerm },
        publicUsersFilters: { search: searchTerm },
        itemsSort: SEARCH_ITEMS_SORT,
      },
    })

    const { container, waitFor } = await render()

    const searchDriver = await waitFor(() => topBarDriver(container).search())

    searchDriver.results.areNotVisible()

    await searchDriver.input.setTerm(searchTerm)
    await act(() => {
      jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS)
    })

    searchDriver.results.areVisible()
    expect(searchDriver.results.itemsTab.isActive).toBe(true)
    expect(searchDriver.results.itemsTab.header.text).toBe(
      `Items (${items.length})`
    )

    const foundItems = searchDriver.results.itemsTab.content.listItemsText()
    expect(foundItems).toHaveLength(2)
    expect(foundItems).toStrictEqual(
      expect.arrayContaining(items.map((message) => message.text))
    )

    expect(searchDriver.results.usersTab.isActive).toBe(false)
    await searchDriver.results.usersTab.header.click()
    expect(searchDriver.results.usersTab.isActive).toBe(true)
    expect(searchDriver.results.usersTab.header.text).toBe(
      `Users (${publicUsers.length})`
    )

    const foundUsers = searchDriver.results.usersTab.content.listItemsText()
    expect(foundUsers).toHaveLength(2)
    expect(foundUsers).toStrictEqual(
      expect.arrayContaining(publicUsers.map((user) => user.name))
    )
  })
})
