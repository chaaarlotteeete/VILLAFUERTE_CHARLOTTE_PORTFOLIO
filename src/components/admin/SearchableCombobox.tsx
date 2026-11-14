import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const OTHER_ID = '__other__'

export interface ComboboxOption {
  id: string
  label: string
  keywords?: string
}

export interface SearchableComboboxProps {
  label?: string
  value: string | null
  onChange: (
    value: string | null,
    option?: { id: string; label: string } | null,
  ) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowOther?: boolean
  otherLabel?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function SearchableCombobox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  allowOther = true,
  otherLabel = 'Other',
  disabled,
  required,
  className,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const optionsHaveOther = React.useMemo(
    () =>
      options.some(
        (opt) =>
          opt.id === OTHER_ID ||
          opt.label.trim().toLowerCase() === otherLabel.trim().toLowerCase() ||
          opt.keywords?.toLowerCase() === 'other',
      ),
    [options, otherLabel],
  )

  const showSyntheticOther = allowOther && !optionsHaveOther

  const selectedOption = React.useMemo(() => {
    if (!value) return null
    if (value === OTHER_ID) return { id: OTHER_ID, label: otherLabel }
    return options.find((opt) => opt.id === value) ?? null
  }, [value, options, otherLabel])

  const displayLabel = selectedOption?.label ?? placeholder

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label>
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-10 min-h-10 w-full justify-between font-normal',
              !selectedOption && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command
            filter={(itemValue, search) => {
              if (itemValue.toLowerCase().includes(search.toLowerCase()))
                return 1
              return 0
            }}
          >
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.label} ${option.keywords ?? ''}`}
                    className="min-h-10"
                    onSelect={() => {
                      onChange(option.id, {
                        id: option.id,
                        label: option.label,
                      })
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === option.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {showSyntheticOther ? (
                  <CommandItem
                    key={OTHER_ID}
                    value={otherLabel}
                    className="min-h-10"
                    onSelect={() => {
                      onChange(OTHER_ID, { id: OTHER_ID, label: otherLabel })
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === OTHER_ID ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {otherLabel}
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}