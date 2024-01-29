import render from './utils/render'
import publicUserFactory from 'test/factories/publicUser'
import { ROOT_FEED_ID } from 'src/Home/components/HomePage' // this must be imported after "render" otherwise firebase/auth is not being mocked properly

describe('feed of type person', () => {
  it('renders empty person list', async () => {
    const { screen, waitFor, within } = await render({
      numberOfRecipients: 0,
      includeSelfInPersonFeed: false,
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })

    const feed = screen.getByTestId(`${ROOT_FEED_ID}-feed`)
    expect(feed).toBeInTheDocument()

    expect(
      within(feed).getByText('No one to send messages to')
    ).toBeInTheDocument()
    expect(
      within(feed).getByText('Start by adding someone to your client')
    ).toBeInTheDocument()
  })

  it('renders person list', async () => {
    const { screen, waitFor, recipients, within } = await render()

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })

    expect(screen.queryByLabelText('add item')).not.toBeInTheDocument()

    const feed = screen.getByTestId(`${ROOT_FEED_ID}-feed`)
    expect(feed).toBeInTheDocument()

    recipients.forEach(({ id, name, photoURL }) => {
      const personCard = within(feed).getByTestId(`person-${id}`)
      // @ts-expect-error name is always defined
      expect(within(personCard).getByText(name)).toBeInTheDocument()

      const avatar = within(personCard).getByLabelText(`${name} avatar`)
      expect(avatar).toBeInTheDocument()

      const avatarImage = within(avatar).getByRole('img')
      expect(avatarImage).toBeInTheDocument()
      expect(avatarImage).toHaveAttribute('src', photoURL)

      expect(
        within(personCard).getByLabelText(`message ${name}`)
      ).toBeInTheDocument()
      expect(
        within(personCard).queryByLabelText('user is active')
      ).not.toBeInTheDocument()
    })
  })

  it('renders active indicator when person is active', async () => {
    const person = publicUserFactory.build({ active: true })
    const { screen, waitFor, within } = await render({
      recipients: [person],
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })

    const feed = screen.getByTestId(`${ROOT_FEED_ID}-feed`)
    expect(feed).toBeInTheDocument()

    const personCard = within(feed).getByTestId(`person-${person.id}`)
    expect(personCard).toBeInTheDocument()

    expect(
      within(personCard).getByLabelText('user is active')
    ).toBeInTheDocument()
  })
})
