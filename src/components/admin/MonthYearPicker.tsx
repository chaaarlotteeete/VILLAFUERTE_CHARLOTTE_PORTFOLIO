import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toMonthValue } from '@/utils/date'

const MONTH_OPTIONS = [
  { value: '01', label: '01 — January' },
  { value: '02', label: '02 — February' },
  { value: '03', label: '03 — March' },
  { value: '04', label: '04 — April' },
  { value: '05', label: '05 — May' },
  { value: '06', label: '06 — June' },
  { value: '07', label: '07 — July' },
  { value: '08', label: '08 — August' },
  { value: '09', label: '09 — September' },
  { value: '10', label: '10 — October' },
  { value: '11', label: '11 — November' },
  { value: '12', label: '12 — December' },
] as const

const NONE_MONTH = '__none__'

export function formatMonthYearDisplay(value: string) {
  const trimmed = value.trim()
  if (/^\d{4}$/.test(trimmed)) return trimmed
  const month = toMonthValue(trimmed)
  if (!month) return ''
  const [year, monthNum] = month.split('-')
  if (!year || !monthNum) return ''
  return `${monthNum}/${year}`
}

function parseParts(value: string) {
  const trimmed = value.trim()
  // Allow in-progress year typing: "2", "20", "202", "2024"
  if (/^\d{1,4}$/.test(trimmed)) {
    return { year: trimmed, month: '' }
  }
  const monthValue = toMonthValue(trimmed)
  if (monthValue) {
    const [year, month] = monthValue.split('-')
    return { year: year ?? '', month: month ?? '' }
  }
  const yearOnly = trimmed.match(/^(\d{1,4})/)
  return { year: yearOnly?.[1] ?? '', month: '' }
}

export interface MonthYearPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  helperText?: string
  /** When true, month is optional and year-only values (`YYYY`) are allowed. */
  allowYearOnly?: boolean
}

export function MonthYearPicker({
  label,
  value,
  onChange,
  disabled,
  required,
  helperText,
  allowYearOnly = false,
}: MonthYearPickerProps) {
  if (!allowYearOnly) {
    const monthValue = toMonthValue(value)
    const display = formatMonthYearDisplay(monthValue)

    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </Label>
        <Input
          type="month"
          value={monthValue}
          disabled={disabled}
          required={required}
          className={cn('min-h-10')}
          onChange={(event) => onChange(event.target.value)}
        />
        {display ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {display}
          </p>
        ) : null}
        {helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }

  const { year, month } = parseParts(value)
  const display = formatMonthYearDisplay(value)

  function emit(nextYear: string, nextMonth: string) {
    const y = nextYear.replace(/\D/g, '').slice(0, 4)
    if (!y) {
      onChange('')
      return
    }
    if (y.length < 4) {
      onChange(y)
      return
    }
    if (nextMonth) {
      onChange(`${y}-${nextMonth}`)
      return
    }
    onChange(y)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          value={year}
          disabled={disabled}
          // Avoid native required blocking React-controlled year typing.
          aria-required={required || undefined}
          maxLength={4}
          className={cn('min-h-10')}
          aria-label={`${label} year`}
          onChange={(event) => emit(event.target.value, month)}
        />
        <Select
          value={month || NONE_MONTH}
          disabled={disabled || year.length !== 4}
          onValueChange={(next) =>
            emit(year, next === NONE_MONTH ? '' : next)
          }
        >
          <SelectTrigger className="min-h-10" aria-label={`${label} month`}>
            <SelectValue placeholder="Month (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_MONTH}>Month (optional)</SelectItem>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {display && year.length === 4 ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {display}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {helperText || 'Year is required for a date. Month is optional.'}
      </p>
    </div>
  )
}
