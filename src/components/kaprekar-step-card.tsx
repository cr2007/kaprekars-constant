import { InlineNumber, NumberTiles } from '@/components/number-tiles'
import { Badge } from '@/components/ui/badge'
import { KAPREKAR_CONSTANT, type KaprekarStep } from '@/lib/kaprekar'
import { cn } from 'cn'

interface KaprekarStepCardProps {
  /** The computed step to render. */
  step: KaprekarStep
  /** Position of this step in the routine, used for its badge number and animation delay. */
  index: number
  /** Whether this is the first step; suppresses the connecting line above the badge. */
  isFirst: boolean
  /** Whether this is the last step; suppresses the connecting line below the badge and after it. */
  isLast: boolean
  /** Whether to play the entrance animation (off when steps are inserted without one, if ever needed). */
  animate: boolean
}

/**
 * Renders one round of the routine: the timeline badge, and the equation
 * itself in two forms. A single-line compact equation is shown below an
 * `@[800px]` container-width threshold, where there isn't room for the
 * full tile layout to fit without wrapping; a colorful tile equation is
 * shown above it. Both are always in the DOM so no state is lost
 * switching between them; only one is visible at a time via CSS.
 *
 * The threshold is a raw pixel value, not a named breakpoint, because a
 * CSS `@container` size query is measured against the container's
 * *content box* (padding and border excluded), not the border-box width
 * `getBoundingClientRect` reports. The tile row itself needs ~770px of
 * that content-box width (measured across several widest-spread
 * numbers); 800px leaves margin above that need, and below the ~840px
 * content-box width a 1024px browser viewport actually produces once
 * `#steps`'s own padding and border are subtracted from its ~896px
 * border-box width.
 */
export function KaprekarStepCard({
  step,
  index,
  isFirst,
  isLast,
  animate,
}: KaprekarStepCardProps) {
  const reachedConstant = step.result === KAPREKAR_CONSTANT

  return (
    <div
      id={`step-${index}`}
      className={cn(animate && 'animate-step-in')}
      style={animate ? { animationDelay: `${index * 70}ms` } : undefined}
    >
      <div className="flex gap-4">
        {/* Step 1: the timeline badge. Both connecting-line segments are
            always rendered, and only colored in when a neighbor exists,
            so the badge centers against this row's own height instead of
            sitting flush against whichever end has no neighbor. */}
        <div className="flex shrink-0 flex-col items-center self-stretch">
          <div aria-hidden className={cn('w-px flex-1', !isFirst && 'bg-border')} />
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
              reachedConstant
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
              animate && reachedConstant && 'animate-constant-pulse'
            )}
            style={
              animate && reachedConstant ? { animationDelay: `${index * 70 + 300}ms` } : undefined
            }
          >
            {index + 1}
          </div>
          <div aria-hidden className={cn('w-px flex-1', !isLast && 'bg-border')} />
        </div>

        <div className="flex-1">
          {/* Step 2: compact equation, plain text, for narrow containers. */}
          <div
            id={`step-${index}-equation-compact`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-lg font-bold @[800px]:hidden"
          >
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <InlineNumber digits={step.descendingDigits} />
              <span className="font-chalk text-primary">&minus;</span>
              <InlineNumber digits={step.ascendingDigits} />
              <span className="font-chalk text-foreground">=</span>
              <InlineNumber
                digits={step.resultDigits}
                className={reachedConstant ? 'text-primary' : undefined}
              />
            </span>
            {reachedConstant && <Badge>Kaprekar's constant</Badge>}
          </div>

          {/* Step 3: tile equation, for containers wide enough to fit it
              on one line (see the component doc comment above). The
              "Kaprekar's constant" badge sits below the equation, not
              inside its flex-wrap row: including it there would count its
              width against the one-line fit, forcing the whole equation
              down a line just to make room for the badge. */}
          <div
            id={`step-${index}-equation`}
            className="hidden flex-wrap items-end gap-x-5 gap-y-4 @[800px]:flex"
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Biggest arrangement</span>
              <NumberTiles digits={step.descendingDigits} />
            </div>

            <span className="pb-2 font-chalk text-2xl font-bold text-primary">&minus;</span>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Smallest arrangement</span>
              <NumberTiles digits={step.ascendingDigits} />
            </div>

            <span className="pb-2 font-chalk text-2xl font-bold text-foreground">=</span>

            <div
              id={`step-${index}-result`}
              className={cn(
                '-m-2 flex items-center gap-3 rounded-xl border p-2',
                reachedConstant ? 'border-primary bg-primary/10' : 'border-border'
              )}
            >
              <NumberTiles digits={step.resultDigits} />
            </div>
          </div>

          {reachedConstant && (
            <div className="mt-3 hidden @[800px]:block">
              <Badge>Kaprekar's constant</Badge>
            </div>
          )}
        </div>
      </div>

      {/* The gap to the next step's badge, kept outside the row above so
          it doesn't get counted when that row centers its own badge. */}
      {!isLast && <div aria-hidden className="ml-4 h-8 w-px bg-border" />}
    </div>
  )
}
