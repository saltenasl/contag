const sanitizeString = (string: string) => {
  // Use a regular expression to replace all non-alphanumeric characters with spaces
  const cleanedString = string.replace(/[^a-z0-9\s]/gi, ' ')

  // Use another regular expression to sanitize the spaces
  const sanitizedString = cleanedString.replace(/\s+/g, ' ').trim()

  return sanitizedString
}

const toFullTextSearchTerm = (search: string) =>
  `${sanitizeString(search).split(' ').join('&')}:*`

export default toFullTextSearchTerm
