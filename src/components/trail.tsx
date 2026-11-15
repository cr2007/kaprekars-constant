import { ChevronRight } from 'lucide-react'
import { pad4 } from '@/hooks/use-playback'
import type { KaprekarStep } from '@/lib/kaprekar'
import { cn } from 'cn'

interface TrailProps {
  steps: KaprekarStep[]
  index: number
  /** Steps past this one show as dots, so the trail fills in as the run plays. */
  reached: number
  /** True once this run has shown 6174. The goal at the end lights up. */
  arrived: boolean
  onPick: (index: number) => void
}

/**
 * The run as a native radio group: one option per step, labelled with
 * the number that step starts from, then the goal, 6174. Arrow keys move
 * between steps as in any radio group. Phones drop the goal label, so 8
 * options keep a 44 px target each. Render it only with a run: it reads
 * `steps[0]`.
 */
export function Trail({ steps, index, reached, arrived, onPick }: TrailProps) {
  // scroll-mb: a focused option scrolls clear of the playback bar under it.
  return (
    <div className="flex min-h-13 scroll-mb-24 items-center gap-1.5 max-sm:-mx-1">
      <fieldset className="flex min-w-0 flex-1 gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
        <legend className="sr-only">Steps from {pad4(steps[0].input)}</legend>
        {steps.map((s, i) => (
          <label
            key={i}
            className={cn(
              'flex min-h-11 min-w-0 flex-1 cursor-pointer touch-manipulation items-center justify-center rounded-full px-1 select-none has-focus-visible:ring-2 has-focus-visible:ring-ring',
              i === index ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
            )}
          >
            <input
              type="radio"
              name="trail"
              className="sr-only"
              checked={i === index}
              onChange={() => onPick(i)}
            />
            {i <= reached ? (
              <span key="shown" className="stage-fade-in font-mono text-sm tabular-nums sm:text-lg">
                <span className="sr-only">Step {i + 1}, from </span>
                {pad4(s.input)}
              </span>
            ) : (
              <span key="hidden">
                <span className="sr-only">Step {i + 1}, not shown yet</span>
                <span aria-hidden className={i === index ? undefined : 'text-muted-foreground'}>
                  ····
                </span>
              </span>
            )}
          </label>
        ))}
      </fieldset>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground max-sm:hidden" />
      <span
        className={cn(
          'font-mono text-base tabular-nums max-sm:hidden sm:text-lg',
          arrived ? 'font-bold text-primary' : 'text-muted-foreground'
        )}
      >
        <span className="sr-only">Goal: </span>6174
      </span>
    </div>
  )
}
