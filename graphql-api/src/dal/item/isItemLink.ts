import isItemId from './isItemId'

const isLink = (string: string, urlPrefix: string) => {
  if (string.startsWith(urlPrefix)) {
    const [_, potentialId] = string.split(urlPrefix)

    return potentialId && isItemId(potentialId)
  }

  return false
}

const isItemLink = (string: string) => {
  return (
    isLink(string, 'https://contagapp.com/item/') ||
    isLink(string, 'https://www.contagapp.com/item/')
  )
}

export default isItemLink
