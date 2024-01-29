import { Grid, TextField, ToggleButton, ToggleButtonGroup } from '..'
import { DateTimePicker as MaterialDateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'

interface OnChangeInput {
  isValid: boolean
  dateTimeISOString: string | null
}

interface Props {
  label: string
  initialValue: string | null
  onChange: ({ isValid, dateTimeISOString }: OnChangeInput) => void
}

enum PresetValue {
  now,
  minutesFifteen,
  minutesThirty,
  hoursOne,
  hoursTwo,
  hoursFour,
  daysOne,
  daysTwo,
  daysThree,
  weeksOne,
  weeksTwo,
  monthsOne,
  monthsTwo,
  monthsThree,
  monthsSix,
  yearsOne,
  custom,
  none,
}

const calculateDate = (value: PresetValue) => {
  switch (value) {
    case PresetValue.now:
      return dayjs()

    case PresetValue.minutesFifteen:
      return dayjs().add(15, 'minute')

    case PresetValue.hoursOne:
      return dayjs().add(1, 'hour')

    case PresetValue.hoursFour:
      return dayjs().add(4, 'hour')

    case PresetValue.daysOne:
      return dayjs().add(1, 'day')

    case PresetValue.daysThree: // this is very important for the use case of next working day when using system on a Friday
      return dayjs().add(3, 'day')

    // TODO: add next working day
    // TODO: add next working day specific to the assignee (how handle differences when n assignees?)

    case PresetValue.weeksOne:
      return dayjs().add(1, 'week')

    case PresetValue.weeksTwo:
      return dayjs().add(2, 'week')

    case PresetValue.monthsOne:
      return dayjs().add(1, 'month')

    case PresetValue.monthsThree:
      return dayjs().add(3, 'month')

    case PresetValue.yearsOne:
      return dayjs().add(1, 'year')

    case PresetValue.none:
      return null

    default:
      console.warn('unknown value selected in FutureDateTimePicker', {
        value,
      })
      break
  }

  return null
}

const toOnChangeInput = (date: Dayjs | null): OnChangeInput => {
  if (date === null) {
    return {
      isValid: true,
      dateTimeISOString: null,
    }
  }

  const isValid = date.isValid()

  return {
    isValid,
    dateTimeISOString: isValid ? date.toISOString() : null,
  }
}

const FutureDateTimePicker = ({ label, initialValue, onChange }: Props) => {
  const [presetValue, setPresetValue] = useState<PresetValue>(
    initialValue === null ? PresetValue.none : PresetValue.custom
  )
  const [date, setDate] = useState<Dayjs | null>(
    initialValue === null ? null : dayjs(initialValue)
  )

  return (
    <>
      <Grid>
        <ToggleButtonGroup
          value={presetValue}
          exclusive
          size='small'
          onChange={(event, value) => {
            setPresetValue(value)
            const date = calculateDate(value)
            setDate(date)
            onChange(toOnChangeInput(date))
          }}
          aria-label='complete until quick options'
        >
          <ToggleButton value={PresetValue.now} aria-label='now'>
            now
          </ToggleButton>
          <ToggleButton
            value={PresetValue.minutesFifteen}
            aria-label='15 minutes'
          >
            15min
          </ToggleButton>
          <ToggleButton value={PresetValue.hoursOne} aria-label='1 hour'>
            1h
          </ToggleButton>
          <ToggleButton value={PresetValue.hoursFour} aria-label='4 hours'>
            4h
          </ToggleButton>
          <ToggleButton value={PresetValue.daysOne} aria-label='1 day'>
            1d
          </ToggleButton>
          <ToggleButton value={PresetValue.daysThree} aria-label='3 days'>
            3d
          </ToggleButton>
          <ToggleButton value={PresetValue.weeksOne} aria-label='1 week'>
            1w
          </ToggleButton>
          <ToggleButton value={PresetValue.weeksTwo} aria-label='2 weeks'>
            2w
          </ToggleButton>
          <ToggleButton value={PresetValue.monthsOne} aria-label='1 month'>
            1m
          </ToggleButton>
          <ToggleButton value={PresetValue.monthsThree} aria-label='3 months'>
            3m
          </ToggleButton>
          <ToggleButton value={PresetValue.yearsOne} aria-label='1 year'>
            1y
          </ToggleButton>
          <ToggleButton value={PresetValue.none} aria-label='none'>
            none
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid>
        <MaterialDateTimePicker
          label={label}
          renderInput={(props) => <TextField {...props} placeholder='' />}
          value={date}
          ampm={false}
          disablePast
          inputFormat='YYYY-MM-DD HH:mm'
          minutesStep={15}
          onChange={(value) => {
            setPresetValue(PresetValue.custom)
            setDate(value)
            onChange(toOnChangeInput(value))
          }}
        />
      </Grid>
    </>
  )
}

export default FutureDateTimePicker
