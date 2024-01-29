import dayjs from 'dayjs'

const differenceFromNow: (
  date: Date | string,
  unit: Parameters<InstanceType<typeof dayjs.Dayjs>['diff']>[1]
) => number = (date, unit = 'hour') => {
  const now = dayjs()

  return dayjs(date).diff(now, unit)
}

export default differenceFromNow
