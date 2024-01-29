/* eslint-disable jest/no-conditional-expect */
import { faker } from '@faker-js/faker'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import messageFactory from 'test/factories/message'
import mockGetItems from 'test/requestMocks/getItems'
import render from './utils/render'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'

describe('feed sort', () => {
  it('the default sort is type=CreatedAt and order=NewestFirst', async () => {
    const { getFeedRequestInfo, personsFeed, within } =
      await renderAndNavigateToPersonsFeed({
        items: [],
      })

    expect(within(personsFeed).getByText('Created at')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(within(personsFeed).getByText('Expected by')).toHaveAttribute(
      'aria-pressed',
      'false'
    )

    expect(getFeedRequestInfo.calledTimes).toBe(1)
    expect(getFeedRequestInfo.calls).toStrictEqual([
      expect.objectContaining({
        requestVariables: expect.objectContaining({
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
        }),
      }),
    ])
  })

  it("doesn't have sort type toggle in person feed", async () => {
    const { screen, waitFor } = await render()

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })

    expect(screen.queryByText('toggle sort')).not.toBeInTheDocument()
  })

  it('toggles sort back and forth', async () => {
    const newestFirstFeedMessage = messageFactory.build()
    const oldestFirstFeedMessage = messageFactory.build()

    const { personsFeed, person, within, userEvent, waitFor } =
      await renderAndNavigateToPersonsFeed({
        items: [newestFirstFeedMessage],
      })

    const { requestInfo: getFeedRequestInfo } = mockGetItems({
      items: [oldestFirstFeedMessage],
      input: {
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: { parentId: person.id },
      },
    })

    const feedQueryCalledTimes = getFeedRequestInfo.calledTimes

    expect(within(personsFeed).getByText('Created at')).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    const toggleSortButton = within(personsFeed).getByText('toggle sort')
    expect(toggleSortButton).toBeInTheDocument()

    expect(
      within(personsFeed).getByText(newestFirstFeedMessage.text)
    ).toBeInTheDocument()
    expect(
      within(personsFeed).queryByText(oldestFirstFeedMessage.text)
    ).not.toBeInTheDocument()

    await userEvent.click(toggleSortButton)

    expect(getFeedRequestInfo.calledTimes).toBe(feedQueryCalledTimes + 1)
    expect(getFeedRequestInfo.calls[feedQueryCalledTimes]).toStrictEqual(
      expect.objectContaining({
        requestVariables: expect.objectContaining({
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.OldestFirst,
          },
        }),
      })
    )

    await waitFor(() => {
      expect(
        within(personsFeed).getByText(oldestFirstFeedMessage.text)
      ).toBeInTheDocument()
    })
    expect(
      within(personsFeed).queryByText(newestFirstFeedMessage.text)
    ).not.toBeInTheDocument()

    await userEvent.click(within(personsFeed).getByText('toggle sort'))

    await waitFor(() => {
      expect(
        within(personsFeed).getByText(newestFirstFeedMessage.text)
      ).toBeInTheDocument()
    })
    expect(
      within(personsFeed).queryByText(oldestFirstFeedMessage.text)
    ).not.toBeInTheDocument()
  })

  it('correctly updates feed with new item when sorted by CreatedAt and order is OldestFirst', async () => {
    const olderMessage = messageFactory.build()
    const text = faker.lorem.sentence()

    mockGetItems({
      items: [olderMessage],
    })
    const { userEvent, waitFor, personsFeed, within, sendMessageRequestInfo } =
      await renderAndNavigateToPersonsFeed({ items: [olderMessage] })

    await userEvent.click(within(personsFeed).getByText('toggle sort'))

    await waitFor(() => {
      expect(
        within(personsFeed).queryByLabelText('Loading')
      ).not.toBeInTheDocument()
    })

    await userEvent.click(within(personsFeed).getByLabelText('add item'))

    const sendButton = within(personsFeed).getByLabelText('send')
    const textInput = within(personsFeed).getByLabelText('Type message here')

    await userEvent.type(textInput, text)

    expect(sendButton).not.toBeDisabled()

    await userEvent.click(sendButton)

    expect(sendMessageRequestInfo.calledTimes).toBe(1)
    await waitFor(() => {
      expect(within(personsFeed).getByText(text)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        within(personsFeed)
          .getAllByLabelText('item text')
          .map(({ textContent }) => textContent)
      ).toStrictEqual([olderMessage.text, text])
    })
  })

  it('correctly updates feed with new item when sort sorted by CreatedAt and order is NewestFirst', async () => {
    const olderMessage = messageFactory.build()
    const text = faker.lorem.sentence()

    mockGetItems({
      items: [olderMessage],
    })
    const { userEvent, waitFor, personsFeed, within, sendMessageRequestInfo } =
      await renderAndNavigateToPersonsFeed({ items: [olderMessage] })

    await userEvent.click(within(personsFeed).getByLabelText('add item'))

    const sendButton = within(personsFeed).getByLabelText('send')
    const textInput = within(personsFeed).getByLabelText('Type message here')

    await userEvent.type(textInput, text)

    expect(sendButton).not.toBeDisabled()

    await userEvent.click(sendButton)

    expect(sendMessageRequestInfo.calledTimes).toBe(1)
    await waitFor(() => {
      expect(within(personsFeed).getByText(text)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        within(personsFeed)
          .getAllByLabelText('item text')
          .map(({ textContent }) => textContent)
      ).toStrictEqual([text, olderMessage.text])
    })
  })

  it('sorts by expected by (complete until)', async () => {
    const { personsFeed, within, userEvent, waitFor } =
      await renderAndNavigateToPersonsFeed()

    const { requestInfo } = mockGetItems()

    await userEvent.click(within(personsFeed).getByText('Expected by'))

    expect(requestInfo.calledTimes).toBe(1)
    expect(requestInfo.calls[0].requestVariables).toStrictEqual(
      expect.objectContaining({
        sort: {
          type: ItemsSortType.CompleteUntil,
          order: ItemsSortOrder.NewestFirst,
        },
      })
    )

    await waitFor(() => {
      expect(
        within(personsFeed).queryByLabelText('Loading')
      ).not.toBeInTheDocument()
    })

    await userEvent.click(within(personsFeed).getByText('toggle sort'))

    expect(requestInfo.calledTimes).toBe(2)
    expect(requestInfo.calls[1].requestVariables).toStrictEqual(
      expect.objectContaining({
        sort: {
          type: ItemsSortType.CompleteUntil,
          order: ItemsSortOrder.OldestFirst,
        },
      })
    )
  })
})
