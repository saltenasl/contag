import dayjs from 'dayjs'

const formatDate = (date: Date | string): string =>
  dayjs(date).format('YYYY-MM-DD HH:mm')

export default formatDate
