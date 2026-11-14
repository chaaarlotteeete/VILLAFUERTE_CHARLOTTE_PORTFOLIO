import { format, parseISO, isValid } from 'date-fns'

export type DatePrecision = 'year' | 'month'

/** Normalize DB/date strings to `YYYY-MM` for month inputs. */
export function toMonthValue(value: string | null | undefined) {
  if (!value) return ''
  const match = value.match(/^(\d{4}-\d{2})/)
  return match?.[1] ?? ''
}

/** Convert `YYYY-MM` month picker values to a date string for Postgres `date`. */
export function fromMonthValue(value: string | null | undefined) {
  if (!value?.trim()) return null
  const month = toMonthValue(value.trim())
  return month ? `${month}-01` : null
}

/** Form value: `YYYY` (year-only) or `YYYY-MM` (month+year). */
export function toFlexibleDateValue(
  value: string | null | undefined,
  precision: DatePrecision | null | undefined = 'month',
) {
  if (!value) return ''
  const yearMatch = value.match(/^(\d{4})/)
  if (!yearMatch) return ''
  if (precision === 'year') return yearMatch[1]
  return toMonthValue(value) || yearMatch[1]
}

export function fromFlexibleDateValue(value: string | null | undefined): {
  date: string | null
  precision: DatePrecision | null
} {
  if (!value?.trim()) return { date: null, precision: null }
  const trimmed = value.trim()
  if (/^\d{4}$/.test(trimmed)) {
    const year = Number(trimmed)
    if (year < 1900 || year > 2100) return { date: null, precision: null }
    return { date: `${trimmed}-01-01`, precision: 'year' }
  }
  const month = toMonthValue(trimmed)
  if (!month) return { date: null, precision: null }
  const [y, m] = month.split('-')
  const year = Number(y)
  const monthNum = Number(m)
  if (
    year < 1900 ||
    year > 2100 ||
    monthNum < 1 ||
    monthNum > 12
  ) {
    return { date: null, precision: null }
  }
  return { date: `${month}-01`, precision: 'month' }
}

/** Compare flexible form values (`YYYY` or `YYYY-MM`). Negative if a < b. */
export function compareFlexibleDateValues(a: string, b: string) {
  const [ay, am] = a.split('-')
  const [by, bm] = b.split('-')
  if (ay !== by) return ay.localeCompare(by)
  if (!am || !bm) return 0
  return am.localeCompare(bm)
}

function parseFlexibleDate(value: string) {
  const normalized = /^\d{4}$/.test(value)
    ? `${value}-01-01`
    : /^\d{4}-\d{2}$/.test(value)
      ? `${value}-01`
      : value
  const date = parseISO(normalized)
  return isValid(date) ? date : null
}

export function formatDate(
  value: string | null | undefined,
  pattern = 'MMM yyyy',
  precision: DatePrecision | null | undefined = 'month',
) {
  if (!value) return null
  const date = parseFlexibleDate(value)
  if (!date) return null
  if (precision === 'year') return format(date, 'yyyy')
  return format(date, pattern)
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
  startPrecision: DatePrecision | null | undefined = 'month',
  endPrecision: DatePrecision | null | undefined = 'month',
) {
  const startLabel = formatDate(start, 'MMM yyyy', startPrecision) ?? 'Present'
  if (isCurrent) return `${startLabel} – Present`
  const endLabel = formatDate(end, 'MMM yyyy', endPrecision)
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}

export function getYear(value: string | null | undefined) {
  if (!value) return null
  const date = parseFlexibleDate(value)
  if (!date) return null
  return date.getFullYear()
}
