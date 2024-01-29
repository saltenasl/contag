import { within } from '@testing-library/react'
import searchDriver from './search'

const topBarDriver = (parentElement: HTMLElement) => {
  const topBar = within(parentElement).getByLabelText('top bar')

  expect(topBar).toBeInTheDocument()

  return {
    search: () => searchDriver(topBar),
  }
}

export default topBarDriver
