import renderApp from './utils/renderApp'

describe('App', () => {
  it('renders', async () => {
    const { screen } = await renderApp()

    expect(screen.getByText('Start using Contag!')).toBeInTheDocument()
  })
})
