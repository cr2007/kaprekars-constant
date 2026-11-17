import { ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { usePillDrag } from '@/hooks/use-pill-drag'
import { type KaprekarStep, pad4 } from '@/lib/kaprekar'
import { LIFT } from '@/lib/pill-motion'
import { reducedMotion } from '@/lib/motion'
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
 * The run as a scrubber: one native radio per step, labelled with the number that step starts from, then the goal 6174.
 *
 * @remarks
 * - A pill sits on the shown step. {@link usePillDrag} moves it.
 * - A tap on the shown step stops autoplay there.
 * - Arrow keys move between steps as in any radio group.
 * - Phones drop the goal label, so 8 steps keep a 44 px target each.
 * - Render it only with a run: it reads `steps[0]`.
 * - {@link StageStep} shows the picked step.
 */
export function Trail({ steps, index, reached, arrived, onPick }: TrailProps) {
  const { pillRef, copyRef, sheenRef, optionRef, held, lifted, select, onLabelClick, trackHandlers } = usePillDrag(
    index,
    steps.length,
    onPick
  )

  /** The text of step `i`, or dots before the run reaches it. On the pill, the dots take the pill's text color. */
  const number = (s: KaprekarStep, i: number, onPill = false) =>
    i <= reached ? (
      <span key="shown" className="trail-num stage-fade-in font-mono tabular-nums">
        {pad4(s.input)}
      </span>
    ) : (
      <span key="hidden" aria-hidden className={onPill ? undefined : 'text-muted-foreground'}>
        ····
      </span>
    )

  // scroll-mb: a focused step scrolls clear of the playback bar under it.
  return (
    <div id="trail" className="flex min-h-13 scroll-mb-24 items-center gap-1.5 max-sm:-mx-1">
      <fieldset
        id="trail-steps"
        className="glass-track relative grid min-w-0 flex-1 touch-pan-y grid-cols-[repeat(var(--n),minmax(0,1fr))] rounded-full p-1 select-none [container-type:inline-size]"
        style={{ '--n': steps.length } as CSSProperties}
        {...trackHandlers}
      >
        <legend className="sr-only">Steps from {pad4(steps[0].input)}</legend>
        {steps.map((s, i) => (
          <label
            key={i}
            id={`trail-step-${i + 1}`}
            ref={optionRef(i)}
            onClick={onLabelClick}
            // An outline with an offset: the pill sits above the labels, and it would hide a ring inside the label.
            className="flex min-h-11 min-w-0 cursor-pointer touch-manipulation items-center justify-center rounded-full px-1 text-foreground outline-ring hover:bg-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
          >
            {/* onClick also fires for the checked radio, where onChange does not: a tap on the shown step stops there. */}
            <input
              type="radio"
              name="trail"
              className="sr-only"
              checked={i === index}
              onChange={() => select(i)}
              onClick={() => i === index && onPick(i)}
            />
            <span className="sr-only">{i <= reached ? `Step ${i + 1}, from ` : `Step ${i + 1}, not shown yet`}</span>
            {number(s, i)}
          </label>
        ))}
        {/* The pill rests `--i` step widths from the start, above the labels, and lets pointers through.
            A drag writes inline px transforms over it. Its numbers move the other way, to line up with the track's. */}
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 [transform:translateX(calc(var(--i)*100%))]"
          style={{ width: `calc((100% - 0.5rem) / ${steps.length})`, '--i': index } as CSSProperties}
        >
          <span
            ref={sheenRef}
            data-lifted={lifted || undefined}
            className="glass-sheen absolute inset-0 rounded-full bg-primary transition-[scale] duration-200 ease-out motion-reduce:transition-none forced-colors:outline-2 forced-colors:outline-offset-[-2px] forced-colors:outline-[Highlight] forced-colors:outline-solid"
            style={held && !reducedMotion() ? { scale: LIFT } : undefined}
          />
          <span className="absolute inset-0 overflow-hidden rounded-full text-primary-foreground">
            <span
              ref={copyRef}
              className="absolute inset-y-0 left-0 grid w-[calc(var(--n)*100%)] grid-cols-[repeat(var(--n),minmax(0,1fr))] [transform:translateX(calc(var(--i)*-100%/var(--n)))]"
            >
              {steps.map((s, i) => (
                <span key={i} className="flex min-w-0 items-center justify-center px-1">
                  {number(s, i, true)}
                </span>
              ))}
            </span>
          </span>
        </span>
      </fieldset>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground max-sm:hidden" />
      <span
        id="trail-goal"
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
