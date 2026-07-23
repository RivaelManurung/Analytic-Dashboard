"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  from: string | null
  to: string | null
  onChange: (from: string | null, to: string | null) => void
  trigger: React.ReactElement
}

/** Parses an ISO date defensively — the value comes from the URL, so it may be junk. */
function safeParse(value: string | null): Date | undefined {
  if (!value) return undefined
  try {
    const parsed = parseISO(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  } catch {
    return undefined
  }
}

export function DateRangePicker({ from, to, onChange, trigger }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>({
    from: safeParse(from),
    to: safeParse(to),
  })

  // The range is only committed on Apply. Writing each click straight to the
  // URL would trigger a server fetch for the half-selected range in between.
  const apply = () => {
    if (draft?.from && draft?.to) {
      onChange(format(draft.from, "yyyy-MM-dd"), format(draft.to, "yyyy-MM-dd"))
      setOpen(false)
    }
  }

  const clear = () => {
    setDraft(undefined)
    onChange(null, null)
    setOpen(false)
  }

  /*
   * Re-seed the draft from the current props each time the popover opens.
   *
   * `draft` is derived state, and this component never unmounts — only the
   * popup does. Without this, an external change to the range (clicking Reset,
   * or picking a preset in PeriodFilter, both of which clear from/to in the
   * URL) leaves the calendar showing the old selection the next time it opens.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft({ from: safeParse(from), to: safeParse(to) })
    }
    setOpen(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={2}
          // A range ending in the future has no data behind it.
          disabled={{ after: new Date() }}
          autoFocus
          className="p-3"
        />
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
            Clear
          </Button>
          <Button
            size="sm"
            onClick={apply}
            disabled={!draft?.from || !draft?.to}
            className="text-xs"
          >
            Apply range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
