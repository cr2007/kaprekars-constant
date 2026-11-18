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
  /** When the circle starts around 6174, in ms after `arrived`. The steps fade out then, and the result fades in after them. */
  circleMs: number
}

/** The steps fade out in this many ms, then the result fades in. */
const SWAP_MS = 200

/** Hides a layer but keeps its height, so the page does not jump when it shows. */
const hiddenLayer = 'invisible opacity-0'

/**
 * The routine in the words of the stage's row labels, so a first run maps onto it.
 *
 * @remarks It renders in two places, so each caller gives its own `id`.
 */
export function HowItWorks({ id }: { id: string }) {
  return (
    <ol id={id} className="flex list-decimal flex-col gap-1 pl-5 text-pretty text-muted-foreground marker:font-mono marker:text-primary">
      <li>Sort the digits biggest first.</li>
      <li>Sort them smallest first.</li>
      <li>Subtract to get the difference.</li>
      <li>Repeat with the difference.</li>
    </ol>
  )
}

/**
 * The panel beside (desktop) or under (phone) the stage during a run.
 *
 * @remarks
 * - Before 6174 it shows the rounds left and the routine.
 * - After 6174 it shows, in story order: the result, what 6174 does next, then another number to try.
 * - Both layers share one grid cell, so the panel keeps the taller height.
 * - Key it by run id, so each run reveals its result again.
 * - `circleMs` is the step's motion time plus the circle delay, so the swap waits for the hand circle.
 */
export function EndPanel({ run, arrived, remaining, circleMs }: EndPanelProps) {
  const loopNote = useRef<HTMLParagraphElement>(null)

  /** Adds the loop step, then moves focus to the note that replaces the button. */
  function addLoopStep() {
    flushSync(() => run.addLoopStep())
    loopNote.current?.focus()
  }

  return (
    <div id="end-panel" className="grid content-start *:col-start-1 *:row-start-1">
      <div
        id="end-progress"
        inert={arrived}
        className={cn('flex flex-col gap-3', arrived && cn(hiddenLayer, 'transition-[opacity,visibility] duration-200 ease-out'))}
        style={arrived ? { transitionDelay: `${circleMs}ms` } : undefined}
      >
        {/* On the 6174 step the count is 0: the line stays, so it fades out with the routine. */}
        <p id="rounds-left" className={cn('font-heading text-lg font-bold text-foreground', remaining < 0 && 'invisible')}>
          {remaining === 0 ? (
            'Last round to '
          ) : (
            <>
              <span className="font-mono">{remaining}</span> more round{remaining === 1 ? '' : 's'} to{' '}
            </>
          )}
          <span className="font-mono">6174</span>.
        </p>
        <HowItWorks id="how-it-works" />
      </div>

      {/* The delay waits for the steps to fade out, so the answer never shows early and the panel is never empty. */}
      <div
        id="end-result"
        inert={!arrived}
        className={cn(
          'flex flex-col gap-5 transition-[opacity,visibility] duration-300 ease-out',
          arrived ? 'starting:opacity-0' : hiddenLayer
        )}
        style={arrived ? { transitionDelay: `${circleMs + SWAP_MS}ms` } : undefined}
      >
        <div className="flex flex-col gap-3">
          <StepFact stepCount={Math.max(1, run.stepCount)} />
          <div className="flex flex-wrap items-start gap-2">
            <div className="grid *:col-start-1 *:row-start-1">
              <Button
                id="one-more-button"
                type="button"
                variant="secondary"
                inert={run.hasLoopStep}
                className={cn('h-auto min-h-11 gap-2 px-4 text-base whitespace-normal', run.hasLoopStep && 'invisible')}
                onClick={addLoopStep}
              >
                <RotateCw className="size-4" aria-hidden />
                Do one more round
              </Button>
              {/* Visibility flips at once, so focus can land; the fade waits 150 ms for the new step. */}
              <p
                id="loop-note"
                ref={loopNote}
                tabIndex={-1}
                className={cn(
                  'w-0 min-w-full rounded-lg text-sm text-muted-foreground outline-none transition-opacity delay-150 duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring',
                  !run.hasLoopStep && hiddenLayer
                )}
              >
                <span className="font-mono">6174</span> leads straight back to itself.
              </p>
            </div>
            <ShareLink value={run.rawInput} />
          </div>
        </div>

        <section id="try-another-section" aria-labelledby="try-another" className="flex min-w-0 flex-col gap-2">
          <h2 id="try-another" className="font-heading text-lg font-bold text-foreground">
            Try another number
          </h2>
          <div id="quick-picks" className="@container">
            <QuickPicks onPick={run.runNumber} />
          </div>
          <Challenge current={Number(run.rawInput)} stepCount={run.stepCount} targetIndex={run.challenge} onNext={run.nextChallenge} />
        </section>
      </div>
    </div>
  )
}
