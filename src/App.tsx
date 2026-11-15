import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, RotateCcw } from 'lucide-react'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { BookSideToggle } from '@/components/book-side-toggle'
import { EndPanel, HowItWorks } from '@/components/end-panel'
import { SolidDiceIcon } from '@/components/icons/solid-dice-icon'
import { StageStep } from '@/components/stage-step'
import { ThemeToggle } from '@/components/theme-toggle'
import { Trail } from '@/components/trail'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookSide } from '@/hooks/use-book-side'
import { pad4, usePlayback } from '@/hooks/use-playback'
import { useRun } from '@/hooks/use-run'
import { KAPREKAR_CONSTANT, sanitizeDigitInput } from '@/lib/kaprekar'
import { ARRIVAL_MS, reducedMotion, stepMotionMs } from '@/lib/stage-motion'
import { distribution } from '@/lib/stats'
import { cn } from 'cn'

/** Side and bottom padding that keeps clear of notches and home bars. */
const GUTTERS =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]'
const BAR_BUTTON =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 font-semibold text-foreground outline-none transition-[color,background-color,scale] duration-150 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-97 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100 motion-reduce:active:scale-100 sm:px-4'
const DISCLOSURE = 'group rounded-2xl bg-muted/60 px-4 open:pb-4'
const SUMMARY =
  'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'
const CHEVRON = 'size-4 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none'
/** A step shown at rest lands its 6174 hop this long after it paints. */
const AT_REST_LANDED_MS = 300

/**
 * The Stage: one step at a time, large. The page reads in the order of
 * the story: type a number, watch the stage, see 6174, try another. Each
 * part shows only when its state needs it: the trail and the playback
 * bar wait for a run, and the result waits for 6174.
 */
export default function App() {
  const run = useRun()
  // The input echoes the key at once; the stage renders the new run just after,
  // so the 4th key does not wait for the whole stage.
  const steps = useDeferredValue(run.steps)
  const runId = useDeferredValue(run.runId)
  const play = usePlayback(steps, runId)
  const inputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [allOpen, setAllOpen] = useState(false)
  const book = useBookSide()

  const hasRun = steps.length > 0
  const last = steps.length - 1
  const arrivalIndex = steps.findIndex((s) => s.result === KAPREKAR_CONSTANT)
  // The result panel waits for the 6174 step's motion and its hop.
  const revealMs = (play.animate && arrivalIndex >= 0 ? stepMotionMs(arrivalIndex) : AT_REST_LANDED_MS) + ARRIVAL_MS
  const arrived = arrivalIndex >= 0 && play.reached >= arrivalIndex
  const partial = run.rawInput.length > 0 && run.rawInput.length < 4 && run.rawInput[0] !== '0'
  const showAlert = run.error !== null && !partial

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

  const playLabel = play.playing ? 'Pause' : play.index >= last ? 'Replay' : 'Play'
  const PlayIcon = play.playing ? Pause : playLabel === 'Replay' ? RotateCcw : Play

  return (
    <div
      id="page"
      data-book-side={book.side}
      className={`mx-auto flex min-h-svh max-w-5xl flex-col gap-4 pt-[max(1rem,env(safe-area-inset-top))] lg:gap-5 lg:pt-8 ${GUTTERS}`}
    >
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground focus-visible:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Step 1 of the story: the number goes in, right above where it plays. */}
      <header id="page-header" className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3">
        <h1 className="text-balance font-heading text-[clamp(1.25rem,6.2vw,2rem)] leading-tight font-bold text-foreground lg:text-4xl">
          Watch a number become <span className="font-mono text-primary">6174</span>
        </h1>
        <div className="flex">
          <BookSideToggle side={book.side} toggleSide={book.toggleSide} />
          <ThemeToggle />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="number-input" className="sr-only text-muted-foreground lg:not-sr-only">
            Your 4-digit number
          </Label>
          <div className="flex gap-2">
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
              aria-invalid={showAlert || undefined}
              aria-describedby={run.error ? 'input-note' : undefined}
              className="h-14 flex-1 bg-card text-center font-mono text-3xl font-bold tracking-[0.2em] shadow-sm md:text-3xl lg:w-44 lg:flex-none"
            />
            <Button
              id="random-button"
              type="button"
              variant="outline"
              className="h-14 gap-2 bg-card px-4 text-base"
              onClick={run.random}
            >
              <SolidDiceIcon id="random-dice-icon" className="size-5" />
              Random
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="grid gap-4 min-[840px]:grid-cols-[minmax(0,1fr)_21rem] min-[840px]:gap-x-8 min-[840px]:gap-y-5 lg:gap-x-10">
        <output className="sr-only">{play.message}</output>

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
              empty={
                <div className="flex max-w-sm flex-col gap-4 text-left">
                  {showAlert ? (
                    <Alert id="input-note" variant="destructive" className="text-base">
                      <AlertDescription>{run.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <p id="input-note" className="text-pretty font-heading text-lg font-bold text-foreground">
                      {partial ? (
                        <>
                          <span className="font-mono">{4 - run.rawInput.length}</span> more digit
                          {run.rawInput.length === 3 ? '' : 's'}.
                        </>
                      ) : (
                        <>
                          Type a <span className="font-mono">4</span>-digit number, or press Random.
                        </>
                      )}
                    </p>
                  )}
                  <HowItWorks />
                </div>
              }
            />

            {hasRun && (
              <Trail steps={steps} index={play.index} reached={play.reached} arrived={arrived} onPick={play.go} />
            )}
          </div>

          {hasRun && (
            <>
              {/* In flow, not sticky: on a short screen a stuck bar covered the lower rows of the stage. */}
              <div id="playback-bar">
                <fieldset className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-sm">
                  <legend className="sr-only">Playback</legend>
                  {/* aria-disabled, not disabled: the button keeps focus when it ends the run. */}
                  <button
                    type="button"
                    className={BAR_BUTTON}
                    aria-disabled={play.index === 0}
                    onClick={() => play.go(play.index - 1)}
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                    Back
                  </button>
                  <button
                    type="button"
                    className={cn(BAR_BUTTON, 'min-w-28 bg-primary text-primary-foreground hover:bg-primary/85')}
                    onClick={play.toggle}
                  >
                    <PlayIcon className="size-5" aria-hidden />
                    {playLabel}
                  </button>
                  <button
                    type="button"
                    className={BAR_BUTTON}
                    aria-disabled={play.index >= last}
                    onClick={() => play.go(play.index + 1)}
                  >
                    Next
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </fieldset>
              </div>
            </>
          )}
        </div>

        {/* Steps 3 and 4: how far to 6174, then the result and the next number. */}
        {hasRun && (
          <EndPanel key={runId} run={run} arrived={arrived} remaining={arrivalIndex - play.index} revealMs={revealMs} />
        )}

        {hasRun && (
          <details id="all-steps" className={cn(DISCLOSURE, 'min-[840px]:col-span-2')} onToggle={(event) => setAllOpen(event.currentTarget.open)}>
            <summary id="all-steps-summary" className={SUMMARY}>
              <ChevronRight className={CHEVRON} aria-hidden />
              See all steps
            </summary>
            {allOpen && (
              <ol aria-labelledby="all-steps-summary" className="flex flex-col gap-1 font-mono text-lg tabular-nums">
                {steps.map((s, i) => (
                  <li key={i}>
                    <span className="font-sans text-sm text-muted-foreground">
                      Step <span className="font-mono">{i + 1}</span>:{' '}
                    </span>
                    {pad4(s.descendingNumber)} &minus; {pad4(s.ascendingNumber)} ={' '}
                    <span className={cn(s.result === KAPREKAR_CONSTANT && 'font-bold text-primary')}>
                      {pad4(s.result)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </details>
        )}
      </main>

      <footer id="page-footer">
        <details className={DISCLOSURE}>
          <summary className={SUMMARY}>
            <ChevronRight className={CHEVRON} aria-hidden />
            Where <span className="font-mono">6174</span> comes from
          </summary>
          <p className="max-w-prose text-pretty text-sm text-muted-foreground sm:text-base">
            The mathematician D. R. Kaprekar found this routine in <span className="font-mono">1949</span>,
            working with digits by hand. From any <span className="font-mono">4</span>-digit number with at
            least two different digits, sorting and subtracting always arrived at{' '}
            <span className="font-mono">6174</span>, and then stayed there. Other digit lengths have their own
            resting numbers, but <span className="font-mono">6174</span> is the famous one, and it carries his
            name.
          </p>
          <a
            href="https://en.wikipedia.org/wiki/6174_(number)"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read more on Wikipedia
            <ExternalLink className="size-3.5" aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </details>
      </footer>
    </div>
  )
}
