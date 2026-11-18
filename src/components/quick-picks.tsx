import { type ReactNode, useState } from 'react'
import { dateNumber } from '@/lib/date-number'
import { validateInput } from '@/lib/kaprekar'
import { randomWithSteps } from '@/lib/stats'

interface QuickPicksProps {
  /** Runs a number straight away. */
  onPick: (value: number) => void
}

/**
 * Numbers with a reason to try them, as small chips.
 *
 * @remarks Each chip runs at once, so a second number costs one tap.
 */
export function QuickPicks({ onPick }: QuickPicksProps) {
  // The date is read once per mount, so the chips stay put while the panel is open.
  const [now] = useState(() => new Date())
  const year = now.getFullYear()
  const today = dateNumber(now)
  /** A number in the digit font, inside a chip label. */
  const mono = (n: number) => <span className="font-mono">{n}</span>
  const chips: { key: string; label: ReactNode; pick: () => number }[] = [
    ...(today ? [{ key: 'today', label: <>Today, {mono(today)}</>, pick: () => today }] : []),
    ...(validateInput(String(year)).valid
      ? [{ key: 'year', label: <>This year, {mono(year)}</>, pick: () => year }]
      : []),
    { key: 'slow', label: <>A slow one ({mono(7)} steps)</>, pick: () => randomWithSteps(7) },
    { key: 'fast', label: <>A fast one ({mono(1)} step)</>, pick: () => randomWithSteps(1) },
  ]

  return (
    // role="list": Safari drops list semantics when list-style is none.
    <ul role="list" className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onPick(chip.pick())}
            className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium whitespace-nowrap text-foreground transition-[background-color,scale] duration-150 ease-out select-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-97 motion-reduce:active:scale-100"
          >
            {chip.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
