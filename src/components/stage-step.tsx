import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { HandCircle } from '@/components/hand-circle'
import { NumberTiles } from '@/components/number-tiles'
import { Badge } from '@/components/ui/badge'
import { KAPREKAR_CONSTANT, type KaprekarStep, computeStep } from '@/lib/kaprekar'
import { AT_REST_LANDED_MS, CIRCLE_DELAY_MS, playArrival, playStep, type StageRows } from '@/lib/stage-motion'
import { cn } from 'cn'

/** Holds the stage's height before the first run. It is never shown. */
const PLACEHOLDER = computeStep(3524)

/** Bigger tiles from `md` up. `NumberTiles` puts this class on the tile row. */
const TILE_SIZE = 'md:*:size-14 md:*:text-2xl'

/** One line of the sum: a term and its value, on the parent's three columns. */
const LINE = 'col-span-3 grid grid-cols-subgrid items-center'

interface StageStepProps {
  /** The step to show, or null before a run. */
  step: KaprekarStep | null
  index: number
  total: number
  runId: number
  /** True on the run's first step that reaches 6174. */
  arrival: boolean
  /** False shows a new step at rest, for Back, Next and trail picks. */
  animate: boolean
  /** Shown over the empty stage before a run: a hint or the input error. */
  empty: ReactNode
}

/**
 * The active step as a column sum: the input, its digits biggest first,
 * minus its digits smallest first, equals the difference. It is a
 * description list, so a screen reader hears each line's name with its
 * number. The layout is the same for every step, so the page never
 * changes height between steps.
 */
export function StageStep({ step, index, total, runId, arrival, animate, empty }: StageStepProps) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLElement>(null)
  const desc = useRef<HTMLElement>(null)
  const asc = useRef<HTMLDivElement>(null)
  const result = useRef<HTMLDivElement>(null)
  const resultBox = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLSpanElement>(null)
  const firstPaint = useRef(true)
  const shown = useRef<{ runId: number; index: number } | null>(null)
  const celebrated = useRef<number | null>(null)
  const shownStep = step ?? PLACEHOLDER
  const isConstant = step?.result === KAPREKAR_CONSTANT
  // When the circle around 6174 starts, in ms. Null hides it. Set where the step's motion is planned.
  const [circleAt, setCircleAt] = useState<number | null>(null)

  useLayoutEffect(() => {
    const rows = {
      input: input.current,
      desc: desc.current,
      asc: asc.current,
      result: result.current,
      resultBox: resultBox.current,
      badge: badge.current,
    }
    if (!step || !root.current || Object.values(rows).some((el) => !el)) {
      firstPaint.current = false
      return
    }

    // Step 1: decide the motion. A page opened from `?n=`, and a step picked
    // with Back, Next or the trail, paint at rest at once. The same step
    // again (StrictMode runs effects twice) does nothing new.
    const prev = shown.current
    shown.current = { runId, index }
    const same = prev?.runId === runId && prev.index === index
    let landedAt = AT_REST_LANDED_MS
    if (!same && (firstPaint.current || !animate)) {
      root.current.getAnimations({ subtree: true }).forEach((a) => a.cancel())
    } else if (!same) {
      const handoff = prev?.runId === runId && index === prev.index + 1
      landedAt = playStep(root.current, rows as StageRows, step.digits, index === 0, handoff)
    }
    firstPaint.current = false

    // Step 2: the circle starts 250 ms after the difference lands, with the badge.
    if (!same) setCircleAt(arrival ? landedAt + CIRCLE_DELAY_MS : null)

    // Step 3: the 6174 arrival plays once per run.
    if (arrival && celebrated.current !== runId) {
      celebrated.current = runId
      playArrival(rows as StageRows, landedAt)
    }
  }, [step, index, runId, arrival, animate])

  const label = 'text-sm text-muted-foreground sm:text-base'
  const op = 'text-center font-mono text-2xl font-bold md:text-3xl'

  return (
    <section
      id="stage-card"
      aria-labelledby="stage-heading"
      className="grid rounded-3xl border border-border bg-card p-3 sm:p-6 *:col-start-1 *:row-start-1"
    >
      <div ref={root} className={cn('flex flex-col gap-3 md:gap-4', !step && 'invisible')}>
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
          <h2 id="stage-heading" className="font-heading text-lg font-bold text-foreground md:text-xl">
            Step <span className="font-mono">{index + 1}</span> of <span className="font-mono">{total}</span>
          </h2>
          <Badge id="constant-badge" ref={badge} className={cn(!isConstant && 'invisible')}>
            Kaprekar&apos;s constant
          </Badge>
        </div>

        <dl id="stage-sum" className="grid grid-cols-[minmax(0,auto)_1.5rem_auto] items-center justify-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-3">
          <div id="sum-start" className={LINE}>
            <dt className={label}>Start with</dt>
            <dd ref={input} className="col-start-3">
              <NumberTiles digits={shownStep.digits} className={TILE_SIZE} />
            </dd>
          </div>

          <div id="sum-biggest" className={LINE}>
            <dt className={label}>Biggest first</dt>
            <dd ref={desc} className="col-start-3">
              <NumberTiles digits={shownStep.descendingDigits} className={TILE_SIZE} />
            </dd>
          </div>

          <div id="sum-smallest" className={LINE}>
            <dt className={label}>Smallest first</dt>
            <dd className="col-span-2 grid grid-cols-subgrid items-center">
              <span className={cn(op, 'text-primary')}>&minus;</span>
              <div ref={asc}>
                <NumberTiles digits={shownStep.ascendingDigits} className={TILE_SIZE} />
              </div>
            </dd>
          </div>

          {/* The rule above the difference sits in the extra top margin, clear of the circle's 8 px pad. */}
          <div id="sum-difference" className={cn(LINE, 'mt-3.5')}>
            <dt className={label}>Difference</dt>
            <dd className="relative col-span-2 grid grid-cols-subgrid items-center before:absolute before:inset-x-0 before:-top-3.5 before:h-0.5 before:rounded-full before:bg-border">
              <span className={cn(op, 'text-foreground')}>=</span>
              <div ref={resultBox} className="w-fit">
                <div ref={result}>
                  <HandCircle show={circleAt !== null} delay={circleAt ?? 0} animate={animate}>
                    <NumberTiles digits={shownStep.resultDigits} className={TILE_SIZE} />
                  </HandCircle>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {!step && <div id="stage-empty" className="flex items-center justify-center p-2 text-center">{empty}</div>}
    </section>
  )
}
