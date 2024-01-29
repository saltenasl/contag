import { act, fireEvent, screen } from '@testing-library/react'

enum Keys {
  SPACE = 32,
  ARROW_LEFT = 37,
  ARROW_UP = 38,
  ARROW_RIGHT = 39,
  ARROW_DOWN = 40,
}

export enum DragDirection {
  LEFT = Keys.ARROW_LEFT,
  UP = Keys.ARROW_UP,
  RIGHT = Keys.ARROW_RIGHT,
  DOWN = Keys.ARROW_DOWN,
}

// taken from https://github.com/hello-pangea/dnd/blob/main/test/unit/integration/util/controls.ts#L20
const createTransitionEndEvent = (): Event => {
  const event = new Event('transitionend', {
    bubbles: true,
    cancelable: true,
  }) as TransitionEvent

  // cheating and adding property to event as
  // TransitionEvent constructor does not exist.
  // This is needed because of the following check
  //   https://github.com/atlassian/react-beautiful-dnd/blob/master/src/view/draggable/draggable.jsx#L130
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(event as any).propertyName = 'transform'

  return event
}

export const pickUp = async (element: HTMLElement) => {
  fireEvent.keyDown(element, {
    keyCode: Keys.SPACE,
  })
  await screen.findByText(/You have lifted an item/i)

  await act(() => {
    jest.runOnlyPendingTimers()
  })
}

export const move = async (element: HTMLElement, direction: DragDirection) => {
  fireEvent.keyDown(element, {
    keyCode: direction,
  })
  await screen.findByText(/(You have moved the item | has been combined with)/i)
}

export const drop = async (element: HTMLElement) => {
  fireEvent.keyDown(element, {
    keyCode: Keys.SPACE,
  })
  fireEvent(element, createTransitionEndEvent())

  await screen.findByText(/You have dropped the item/i)
}
