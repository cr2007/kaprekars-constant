import { useState } from 'react'
import { countWithSteps, distribution, shareWithSteps } from '@/lib/stats'
import { cn } from 'cn'

interface StepFactProps {
  /** Steps the current number took to reach 6174 (1 to 7). */
  stepCount: number
}

/** Where a bar's tooltip sits, so the edge bars keep it on screen. */
function tipAlign(index: number, count: number): string {
  if (index < 2) return 'left-0'
  if (index >= count - 2) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

/**
 * "3 steps. 2,124 of the 8,991 numbers you could type take exactly 3."
 * A 7-bar chart shows where that sits. Each bar is a button that shows
 * its own count in a small tooltip on hover, focus, tap or pen hover.
 * The tooltip text is also the button's name, so a screen reader hears
 * the same count. The caption keeps the main fact.
 */
export function StepFact({ stepCount }: StepFactProps) {
  const { byCount, total } = distribution()
  const counts = byCount.slice(1)
  const max = Math.max(...counts.map((c) => c.length))
  const same = countWithSteps(stepCount)
  /** The bar whose tooltip shows, or null. */
  const [open, setOpen] = useState<number | null>(null)

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-pretty text-sm text-muted-foreground sm:text-base">
        <span className="font-semibold text-foreground">
          <span className="font-mono">{stepCount}</span> step{stepCount === 1 ? '' : 's'}.
        </span>{' '}
        <span className="font-mono">{same.toLocaleString('en-US')}</span> of the{' '}
        <span className="font-mono">{total.toLocaleString('en-US')}</span> numbers you could type take
        exactly <span className="font-mono">{stepCount}</span>.
      </figcaption>
      <ul id="step-chart" className="flex items-end gap-1.5">
        {counts.map((numbers, index) => {
          const steps = index + 1
          const current = steps === stepCount
          const share = shareWithSteps(steps)
          return (
            <li key={steps} className="relative flex flex-1">
              <button
                type="button"
                className="flex min-h-11 flex-1 flex-col items-center justify-end gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                // Hover and pen hover show it; a touch tap shows it through focus and click.
                onPointerEnter={(event) => event.pointerType !== 'touch' && setOpen(index)}
                onPointerLeave={(event) => event.pointerType !== 'touch' && document.activeElement !== event.currentTarget && setOpen(null)}
                onFocus={() => setOpen(index)}
                onBlur={() => setOpen(null)}
                onClick={() => setOpen(index)}
                onKeyDown={(event) => event.key === 'Escape' && setOpen(null)}
              >
                {/* Always in the DOM, so it names the button; only its visibility changes, so nothing moves. */}
                <span
                  className={cn(
                    'absolute bottom-full z-20 mb-1.5 flex w-max flex-col rounded-md bg-foreground px-2 py-1 text-left text-xs text-background shadow-md transition-opacity duration-150 ease-out motion-reduce:transition-none',
                    tipAlign(index, counts.length),
                    open === index ? 'opacity-100' : 'pointer-events-none opacity-0'
                  )}
                >
                  <span className="font-semibold">
                    <span className="font-mono">{steps}</span> step{steps === 1 ? '' : 's'}:
                  </span>{' '}
                  <span>
                    <span className="font-mono">{share.count.toLocaleString('en-US')}</span> of{' '}
                    <span className="font-mono">{share.total.toLocaleString('en-US')}</span> numbers (
                    <span className="font-mono">{share.percent.toFixed(1)}</span>%)
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn('w-full rounded-sm', current ? 'bg-primary' : 'bg-muted-foreground/25')}
                  style={{ height: `${Math.max(4, (numbers.length / max) * 40)}px` }}
                />
                <span
                  aria-hidden
                  className={cn('font-mono text-xs tabular-nums', current ? 'font-bold text-primary' : 'text-muted-foreground')}
                >
                  {steps}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
