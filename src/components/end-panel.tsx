import { RotateCw } from 'lucide-react'
import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { Challenge } from '@/components/challenge'
import { QuickPicks } from '@/components/quick-picks'
import { ShareLink } from '@/components/share-link'
import { StepFact } from '@/components/step-fact'
import { Button } from '@/components/ui/button'
import type { Run } from '@/hooks/use-run'
import { cn } from 'cn'

interface EndPanelProps {
  run: Run
  /** True once this run has shown 6174. */
  arrived: boolean
  /** Rounds left after the step on the stage, before 6174. */
  remaining: number
  /** When the result layer starts to fade in, in ms after `arrived`. */
  revealMs: number
}

/** Hides a layer but keeps its height, so the page does not jump when it shows. */
const hiddenLayer = 'invisible opacity-0'

/** The routine in the words of the stage's own row labels, so a first run maps onto it. */
export function HowItWorks() {
  return (
    <ol className="flex list-decimal flex-col gap-1 pl-5 text-pretty text-muted-foreground marker:font-mono marker:text-primary">
      <li>Sort the digits biggest first.</li>
      <li>Sort them smallest first.</li>
      <li>Subtract to get the difference.</li>
      <li>Repeat with the difference.</li>
    </ol>
  )
}

/**
 * What sits beside (desktop) or under (phone) the stage during a run.
 * Before 6174: how many rounds are left, and the routine to follow along.
 * After 6174, in story order: the result, what 6174 does next, then
 * another number to try. Both layers share one grid cell, so the panel
 * keeps the taller one's height. Key it by run id, so each run reveals
 * its result again.
 */
export function EndPanel({ run, arrived, remaining, revealMs }: EndPanelProps) {
  const loopNote = useRef<HTMLParagraphElement>(null)

  /** Adds the loop round, then moves focus to the note that replaces the button. */
  function goFurther() {
    flushSync(() => run.goFurther())
    loopNote.current?.focus()
  }

  return (
    <div id="end-panel" className="grid content-start *:col-start-1 *:row-start-1">
      <div inert={arrived} className={cn('flex flex-col gap-3', arrived && hiddenLayer)}>
        <p className={cn('font-heading text-lg font-bold text-foreground', remaining <= 0 && 'invisible')}>
          <span className="font-mono">{remaining}</span> more round{remaining === 1 ? '' : 's'} to{' '}
          <span className="font-mono">6174</span>.
        </p>
        <HowItWorks />
      </div>

      {/* The delay waits for the 6174 step's motion and its hop, so the answer never shows early. */}
      <div
        inert={!arrived}
        className={cn(
          'flex flex-col gap-5 transition-[opacity,visibility] duration-300 ease-out',
          arrived ? 'starting:opacity-0' : hiddenLayer
        )}
        style={arrived ? { transitionDelay: `${revealMs}ms` } : undefined}
      >
        <div className="flex flex-col gap-3">
          <StepFact stepCount={Math.max(1, run.stepCount)} />
          <div className="flex flex-wrap items-start gap-2">
            <div className="grid *:col-start-1 *:row-start-1">
              <Button
                type="button"
                variant="secondary"
                inert={run.wentFurther}
                className={cn('h-11 gap-2 px-4 text-base', run.wentFurther && 'invisible')}
                onClick={goFurther}
              >
                <RotateCw className="size-4" aria-hidden />
                Do one more round
              </Button>
              {/* Visibility flips at once, so focus can land; the fade waits 150 ms for the new step. */}
              <p
                ref={loopNote}
                tabIndex={-1}
                className={cn(
                  'w-0 min-w-full rounded-lg text-sm text-muted-foreground outline-none transition-opacity delay-150 duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring',
                  !run.wentFurther && hiddenLayer
                )}
              >
                <span className="font-mono">6174</span> leads straight back to itself.
              </p>
            </div>
            <ShareLink value={run.rawInput} />
          </div>
        </div>

        <section aria-labelledby="try-another" className="flex min-w-0 flex-col gap-2">
          <h2 id="try-another" className="font-heading text-lg font-bold text-foreground">
            Try another number
          </h2>
          {/* Phones: one row of chips that scrolls sideways and fades at the edge it hides.
              Inline-size containment stops the unwrapped row from widening the page. */}
          <div className="chip-scroller -mx-1 overflow-x-auto px-1 py-1 [contain:inline-size] max-sm:[&_li]:shrink-0 max-sm:[&>ul]:flex-nowrap">
            <QuickPicks onPick={run.runNumber} />
          </div>
          <Challenge current={Number(run.rawInput)} stepCount={run.stepCount} />
        </section>
      </div>
    </div>
  )
}
