import { format, parseISO, isValid } from 'date-fns'

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

function parseFlexibleDate(value: string) {
  const normalized =
    /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value
  const date = parseISO(normalized)
  return isValid(date) ? date : null
}

export function formatDate(
  value: string | null | undefined,
  pattern = 'MMM yyyy',
) {
  if (!value) return null
  const date = parseFlexibleDate(value)
  if (!date) return null
  return format(date, pattern)
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
) {
  const startLabel = formatDate(start) ?? 'Present'
  if (isCurrent) return `${startLabel} – Present`
  const endLabel = formatDate(end)
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}

export function getYear(value: string | null | undefined) {
  if (!value) return null
  const date = parseFlexibleDate(value)
  if (!date) return null
  return date.getFullYear()
}
