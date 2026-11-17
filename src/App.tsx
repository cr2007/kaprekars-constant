import { useDeferredValue, useEffect, useRef } from 'react'
import { BookSideToggle } from '@/components/book-side-toggle'
import { AllSteps, OriginDetails } from '@/components/disclosures'
import { EndPanel, HowItWorks } from '@/components/end-panel'
import { Hero } from '@/components/hero'
import { InputNote } from '@/components/input-note'
import { DiceIcon } from '@/components/icons/dice-icon'
import { PlaybackBar } from '@/components/playback-bar'
import { StageStep } from '@/components/stage-step'
import { ThemeToggle } from '@/components/theme-toggle'
import { Trail } from '@/components/trail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookSide } from '@/hooks/use-book-side'
import { usePlayback } from '@/hooks/use-playback'
import { useRun } from '@/hooks/use-run'
import { KAPREKAR_CONSTANT, sanitizeDigitInput } from '@/lib/kaprekar'
import { reducedMotion } from '@/lib/motion'
import { AT_REST_LANDED_MS, CIRCLE_DELAY_MS, stepMotionMs } from '@/lib/stage-motion'
import { distribution } from '@/lib/stats'

/** Side and bottom padding that keeps clear of notches and home bars. */
const GUTTERS =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]'

/**
 * The page: the header with the number field, then the Stage that plays one step at a time.
 *
 * @remarks
 * The page reads in story order: type a number, watch the stage, see 6174, try another.
 * Each part shows only when its state needs it. The {@link Trail} and the {@link PlaybackBar}
 * wait for a run. The {@link EndPanel} result waits for 6174.
 */
export default function App() {
  const run = useRun()
  // The input echoes the key at once. The stage renders the new run just after, so the 4th key does not wait.
  const steps = useDeferredValue(run.steps)
  const runId = useDeferredValue(run.runId)
  const play = usePlayback(steps, runId)
  const inputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const book = useBookSide()

  const hasRun = steps.length > 0
  const last = steps.length - 1
  const arrivalIndex = steps.findIndex((s) => s.result === KAPREKAR_CONSTANT)
  // The steps beside the stage stay until the circle starts around 6174, then the result takes their place.
  const circleMs = (play.animate && arrivalIndex >= 0 ? stepMotionMs(steps[arrivalIndex].digits, arrivalIndex) : AT_REST_LANDED_MS) + CIRCLE_DELAY_MS
  const arrived = arrivalIndex >= 0 && play.reached >= arrivalIndex
  const partial = run.rawInput.length > 0 && run.rawInput.length < 4 && run.rawInput[0] !== '0'
  const invalid = run.error !== null && !partial

  // Build the step counts while the page is idle, so the first 6174 does not pay for them.
  useEffect(() => {
    const id = window.setTimeout(distribution, 300)
    return () => window.clearTimeout(id)
  }, [])

  // A new run, or the extra round, started from below the stage brings the stage back into view.
  useEffect(() => {
    const stage = stageRef.current
    if (stage && stage.getBoundingClientRect().top < 0) {
      stage.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
  }, [runId, steps.length])

  /** Runs the typed value. On touch, closes the keyboard once 4 digits are in. */
  function handleChange(value: string) {
    run.setInput(value)
    if (sanitizeDigitInput(value).length === 4 && window.matchMedia('(pointer: coarse)').matches) {
      inputRef.current?.blur()
    }
  }

  return (
    <div
      id="page"
      data-book-side={book.side}
      className={`mx-auto flex min-h-svh max-w-5xl flex-col gap-4 pt-[max(1rem,env(safe-area-inset-top))] lg:gap-5 lg:pt-8 ${GUTTERS}`}
    >
      {/* The link targets the field, not <main>: before a run <main> has nothing to focus. */}
      <a
        id="skip-link"
        href="#number-input"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground focus-visible:shadow-lg"
      >
        Skip to the number field
      </a>

      {/* Step 1: type. isolate keeps the watermark's -z-10 inside the header, above the page background. */}
      <header id="page-header" className="relative isolate grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3">
        <Hero />
        <div className="flex max-sm:absolute max-sm:top-0 max-sm:right-0">
          <BookSideToggle side={book.side} toggleSide={book.toggleSide} />
          <ThemeToggle />
        </div>
        {/* A container: below 19rem (a 280 to 320 px screen, or large text) the field and Random stack. */}
        <div className="@container col-span-2 flex flex-col gap-1.5">
          <Label id="number-label" htmlFor="number-input" className="sr-only text-muted-foreground lg:not-sr-only">
            Your 4-digit number
          </Label>
          <div className="flex gap-2 @max-[19rem]:flex-col">
            {/* No maxLength: it would cut a pasted "1,234" to "1,23" before the sanitizer keeps 4 digits. */}
            <Input
              id="number-input"
              ref={inputRef}
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              spellCheck={false}
              placeholder="····"
              value={run.rawInput}
              onChange={(event) => handleChange(event.target.value)}
              // A full field takes no more keys, so select it: the next 4 keys type a new number.
              onFocus={(event) => event.currentTarget.select()}
              aria-invalid={invalid || undefined}
              aria-describedby={run.error ? 'input-note' : undefined}
              className="h-14 flex-1 bg-card text-center dark:bg-card font-mono text-3xl font-bold tracking-[0.2em] shadow-sm md:text-3xl lg:w-44 lg:flex-none"
            />
            <Button
              id="random-button"
              type="button"
              variant="outline"
              className="h-14 gap-2 bg-card px-4 text-base dark:bg-card"
              onClick={run.random}
            >
              <DiceIcon id="random-dice-icon" className="size-5" />
              Random
            </Button>
          </div>
        </div>
      </header>

      {/* minmax(0, 1fr): content can never widen the phone column past the screen. */}
      <main id="main-content" className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[840px]:grid-cols-[minmax(0,1fr)_21rem] min-[840px]:gap-x-8 min-[840px]:gap-y-5 lg:gap-x-10">
        <output id="playback-status" className="sr-only">{play.message}</output>

        {/* Step 2: watch. The trail and the bar sit under the stage, like a player's controls. */}
        <div id="stage-block" ref={stageRef} className="flex min-w-0 scroll-mt-4 flex-col gap-3">
          <div id="stage-view" className="flex min-w-0 flex-col gap-3">
            <StageStep
              step={steps[play.index] ?? null}
              index={play.index}
              total={steps.length}
              runId={runId}
              arrival={play.index === arrivalIndex}
              animate={play.animate}
              take={play.take}
              empty={
                <div className="flex max-w-sm flex-col gap-4 text-left">
                  <InputNote raw={run.rawInput} error={partial ? null : run.error} />
                  <HowItWorks id="how-it-works-intro" />
                </div>
              }
            />

            {hasRun && (
              <Trail steps={steps} index={play.index} reached={play.reached} arrived={arrived} onPick={play.go} />
            )}
          </div>

          {hasRun && <PlaybackBar play={play} last={last} />}
        </div>

        {/* Steps 3 and 4: how far to 6174, then the result and the next number. */}
        {hasRun && (
          <EndPanel key={runId} run={run} arrived={arrived} remaining={arrivalIndex - play.index} circleMs={circleMs} />
        )}

        {hasRun && <AllSteps steps={steps} className="min-[840px]:col-start-2 min-[840px]:row-start-2" />}

        {/* In a run, wide screens put this under the stage and "See all steps" in the side column. Phones keep source order. */}
        <OriginDetails className={hasRun ? 'min-[840px]:col-start-1 min-[840px]:row-start-2' : 'min-[840px]:col-span-2'} />
      </main>

    </div>
  )
}
