import isItemId from './isItemId'

describe('isItemId', () => {
  it.each`
    search           | result
    ${'Item:1'}      | ${true}
    ${'Item:xxx'}    | ${false}
    ${'Item: 1'}     | ${false}
    ${'Item'}        | ${false}
    ${'search term'} | ${false}
  `('return $result for "$search"', ({ search, result }) => {
    expect(isItemId(search)).toBe(result)
  })
})
