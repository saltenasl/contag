const isItemId = (search: string) => {
  return /^Item:\d+$/.test(search)
}

export default isItemId
