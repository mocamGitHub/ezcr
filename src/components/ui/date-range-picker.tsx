'use client'

import * as React from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths, setMonth, setYear, getMonth, getYear } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { DayPicker } from 'react-day-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  presets?: boolean
}

interface PresetOption {
  label: string
  getValue: () => DateRange
}

const presetOptions: PresetOption[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      return { from: today, to: today }
    },
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: 'This month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: 'Last month',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getYearOptions() {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  presets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(value)
  const [displayMonth, setDisplayMonth] = React.useState<Date>(value?.from || new Date())
  const [secondMonth, setSecondMonth] = React.useState<Date>(() => {
    const base = value?.to || value?.from || new Date()
    // Default to next month if same as displayMonth
    const first = value?.from || new Date()
    if (base.getMonth() === first.getMonth() && base.getFullYear() === first.getFullYear()) {
      return new Date(base.getFullYear(), base.getMonth() + 1, 1)
    }
    return base
  })

  // Sync pending range when value changes externally
  React.useEffect(() => {
    setPendingRange(value)
    if (value?.from) {
      setDisplayMonth(value.from)
    }
    if (value?.to) {
      // Set second month to the "to" date's month, or next month if same as from
      const toMonth = value.to
      const fromMonth = value.from || new Date()
      if (toMonth.getMonth() === fromMonth.getMonth() && toMonth.getFullYear() === fromMonth.getFullYear()) {
        setSecondMonth(new Date(toMonth.getFullYear(), toMonth.getMonth() + 1, 1))
      } else {
        setSecondMonth(toMonth)
      }
    }
  }, [value])

  const handlePresetClick = (preset: PresetOption) => {
    const range = preset.getValue()
    onChange?.(range)
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.(undefined)
    setPendingRange(undefined)
    setOpen(false)
  }

  const handleApply = () => {
    if (pendingRange?.from && pendingRange?.to) {
      // Ensure from < to (swap if needed)
      let from = pendingRange.from
      let to = pendingRange.to
      if (from > to) {
        ;[from, to] = [to, from]
      }
      onChange?.({ from, to })
      setOpen(false)
    }
  }

  const handleCancel = () => {
    setPendingRange(value)
    setOpen(false)
  }

  const handleMonthChange = (monthIndex: string) => {
    const newDate = setMonth(displayMonth, parseInt(monthIndex))
    setDisplayMonth(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = setYear(displayMonth, parseInt(year))
    setDisplayMonth(newDate)
  }

  const handlePrevMonth = () => {
    setDisplayMonth(prev => subMonths(prev, 1))
    setSecondMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setDisplayMonth(prev => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + 1)
      return next
    })
    setSecondMonth(prev => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + 1)
      return next
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
              </>
            ) : (
              format(value.from, 'LLL dd, y')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {presets && (
            <div className="border-r p-2 space-y-1 w-28">
              {presetOptions.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-normal text-xs px-2"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
              {value?.from && (
                <>
                  <div className="h-px bg-border my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left font-normal text-muted-foreground text-xs px-2"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="p-3">
            {/* Two-calendar layout with individual month/year selectors */}
            <div className="flex gap-6">
              {/* Left calendar - From date */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">From</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Select value={getMonth(displayMonth).toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={month} value={i.toString()} className="text-xs">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={getYear(displayMonth).toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-7 w-[75px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DayPicker
                  mode="range"
                  month={displayMonth}
                  onMonthChange={setDisplayMonth}
                  selected={pendingRange}
                  onSelect={setPendingRange}
                  numberOfMonths={1}
                  showOutsideDays
                  className="p-0"
                  classNames={{
                    month: 'space-y-2',
                    month_caption: 'hidden',
                    nav: 'hidden',
                    month_grid: 'w-full border-collapse',
                    weekdays: 'flex',
                    weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center',
                    week: 'flex w-full mt-1',
                    day: 'h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day_button: cn(
                      buttonVariants({ variant: 'ghost' }),
                      'h-8 w-8 p-0 font-normal aria-selected:opacity-100'
                    ),
                    range_end: 'day-range-end',
                    selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    today: 'bg-accent text-accent-foreground',
                    outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-100',
                    disabled: 'text-muted-foreground opacity-50',
                    range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    hidden: 'invisible',
                  }}
                  components={{
                    Chevron: () => <></>,
                  }}
                />
              </div>

              {/* Right calendar - To date */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">To</div>
                <div className="flex items-center gap-2">
                  <Select
                    value={getMonth(secondMonth).toString()}
                    onValueChange={(v) => {
                      const newMonth = parseInt(v)
                      setSecondMonth(setMonth(secondMonth, newMonth))
                    }}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={month} value={i.toString()} className="text-xs">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={getYear(secondMonth).toString()}
                    onValueChange={(v) => {
                      const newYear = parseInt(v)
                      setSecondMonth(setYear(secondMonth, newYear))
                    }}
                  >
                    <SelectTrigger className="h-7 w-[75px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYearOptions().map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <DayPicker
                  mode="range"
                  month={secondMonth}
                  onMonthChange={setSecondMonth}
                  selected={pendingRange}
                  onSelect={setPendingRange}
                  numberOfMonths={1}
                  showOutsideDays
                  className="p-0"
                  classNames={{
                    month: 'space-y-2',
                    month_caption: 'hidden',
                    nav: 'hidden',
                    month_grid: 'w-full border-collapse',
                    weekdays: 'flex',
                    weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center',
                    week: 'flex w-full mt-1',
                    day: 'h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day_button: cn(
                      buttonVariants({ variant: 'ghost' }),
                      'h-8 w-8 p-0 font-normal aria-selected:opacity-100'
                    ),
                    range_end: 'day-range-end',
                    selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    today: 'bg-accent text-accent-foreground',
                    outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-100',
                    disabled: 'text-muted-foreground opacity-50',
                    range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    hidden: 'invisible',
                  }}
                  components={{
                    Chevron: () => <></>,
                  }}
                />
              </div>
            </div>

            {/* Apply/Cancel buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                {pendingRange?.from && pendingRange?.to ? (
                  <>
                    {format(pendingRange.from, 'MMM d, yyyy')} – {format(pendingRange.to, 'MMM d, yyyy')}
                  </>
                ) : pendingRange?.from ? (
                  <>Select end date</>
                ) : (
                  <>Select start date</>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!pendingRange?.from || !pendingRange?.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
