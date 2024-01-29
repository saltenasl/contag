import { POLL_ITEMS_INTERVAL } from 'src/queries/getItems'
import render from './utils/render'

describe('polling in feed', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it(`feed is re-fetched every ${POLL_ITEMS_INTERVAL}ms`, async () => {
    const { screen, waitFor, getFeedRequestInfo } = await render({
      isPollingEnabled: true,
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })

    expect(await screen.findByLabelText('my avatar')).toBeInTheDocument()
    expect(getFeedRequestInfo.calledTimes).toBe(1)

    jest.advanceTimersByTime(POLL_ITEMS_INTERVAL)

    await waitFor(() => {
      expect(getFeedRequestInfo.calledTimes).toBe(2)
    })

    jest.advanceTimersByTime(POLL_ITEMS_INTERVAL)

    await waitFor(() => {
      expect(getFeedRequestInfo.calledTimes).toBe(3)
    })
  })
})
