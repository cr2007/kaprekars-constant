import { countWithSteps, distribution } from '@/lib/stats'
import { cn } from 'cn'

interface StepFactProps {
  /** Steps the current number took to reach 6174 (1 to 7). */
  stepCount: number
}

/**
 * "3 steps. 2,400 of the 8,991 numbers you could type take exactly 3."
 * A 7-bar chart shows where that sits. The caption carries the fact; the
 * bars are decoration for sighted users, so they are hidden from screen
 * readers.
 */
export function StepFact({ stepCount }: StepFactProps) {
  const { byCount, total } = distribution()
  const counts = byCount.slice(1)
  const max = Math.max(...counts.map((c) => c.length))
  const same = countWithSteps(stepCount)

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
      <div aria-hidden className="flex items-end gap-1.5">
        {counts.map((numbers, index) => {
          const steps = index + 1
          const current = steps === stepCount
          return (
            <div key={steps} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn('w-full rounded-sm', current ? 'bg-primary' : 'bg-muted-foreground/25')}
                style={{ height: `${Math.max(4, (numbers.length / max) * 40)}px` }}
              />
              <span
                className={cn('font-mono text-xs tabular-nums', current ? 'font-bold text-primary' : 'text-muted-foreground')}
              >
                {steps}
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}
