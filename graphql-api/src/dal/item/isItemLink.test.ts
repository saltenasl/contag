import isItemLink from './isItemLink'

describe('isItemLink', () => {
  it.each`
    search                                     | result
    ${'https://contagapp.com/item/Item:1'}     | ${true}
    ${'https://www.contagapp.com/item/Item:1'} | ${true}
    ${'https://www.contagapp.com/item/Item:a'} | ${false}
    ${'https://contagapp.com/item/Item:a'}     | ${false}
    ${'some'}                                  | ${false}
    ${'some search term'}                      | ${false}
    ${'Item:1'}                                | ${false}
  `('return $result for "$search"', ({ search, result }) => {
    expect(isItemLink(search)).toBe(result)
  })
})
