import { createContext, useContext } from 'react'

const PollContext = createContext<{ isPollingEnabled: boolean } | undefined>(
  undefined
)

export const useIsPollingEnabled = () => {
  const context = useContext(PollContext)

  if (!context) {
    throw new Error(
      'useIsPollingEnabled cannot be used in a component which is not wrapped with PollContext.Provider'
    )
  }

  return context.isPollingEnabled
}

export default PollContext
