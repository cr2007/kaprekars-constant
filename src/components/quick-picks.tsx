import { type ReactNode, useState } from 'react'
import { dateNumber } from '@/lib/date-number'
import { validateInput } from '@/lib/kaprekar'
import { randomWithSteps } from '@/lib/stats'

interface QuickPicksProps {
  /** Runs a number straight away. */
  onPick: (value: number) => void
}

/**
 * Numbers with a reason to try them, as a grid of small cards.
 *
 * @remarks Each card runs at once, so a second number costs one tap. The grid shows all of them with no sideways scroll.
 */
export function QuickPicks({ onPick }: QuickPicksProps) {
  // The date is read once per mount, so the cards stay put while the panel is open.
  const [now] = useState(() => new Date())
  const year = now.getFullYear()
  const today = dateNumber(now)
  /** A number in the digit font. */
  const mono = (n: number) => <span className="font-mono">{n}</span>
  const cards: { key: string; reason: string; value: ReactNode; pick: () => number }[] = [
    ...(today ? [{ key: 'today', reason: 'Today', value: mono(today), pick: () => today }] : []),
    ...(validateInput(String(year)).valid ? [{ key: 'year', reason: 'This year', value: mono(year), pick: () => year }] : []),
    { key: 'slow', reason: 'A slow one', value: <>{mono(7)} steps</>, pick: () => randomWithSteps(7) },
    { key: 'fast', reason: 'A fast one', value: <>{mono(1)} step</>, pick: () => randomWithSteps(1) },
  ]

  return (
    // role="list": Safari drops list semantics when list-style is none. Below 16rem (280 px, or large text) one column.
    // In two columns, an odd last card takes the full row.
    <ul role="list" className="grid grid-cols-2 gap-2 @max-[16rem]:grid-cols-1 @min-[16rem]:[&>li:last-child:nth-child(odd)]:col-span-2">
      {cards.map((card) => (
        <li key={card.key} className="grid">
          <button
            type="button"
            onClick={() => onPick(card.pick())}
            className="flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-2xl border border-border bg-card px-4 py-2.5 text-left transition-[background-color,scale] duration-150 ease-out select-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-97 motion-reduce:active:scale-100"
          >
            <span className="text-sm text-muted-foreground">
              {card.reason}
              <span className="sr-only">,</span>
            </span>
            <span className="text-lg font-semibold text-foreground">{card.value}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
