import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { HandCircle } from '@/components/hand-circle'
import { NumberTiles } from '@/components/number-tiles'
import { Badge } from '@/components/ui/badge'
import { KAPREKAR_CONSTANT, type KaprekarStep, computeStep } from '@/lib/kaprekar'
import { AT_REST_LANDED_MS, CIRCLE_DELAY_MS, playArrival, playStep, type StageRows } from '@/lib/stage-motion'
import { cn } from 'cn'

/** Holds the stage's height before the first run. */
const PLACEHOLDER = computeStep(3524)

/**
 * Bigger tiles from `md` up, and card-sized tiles below 19rem (a 280 to 320 px screen, or large text).
 *
 * @remarks Card-sized tiles share the card width less the 3 tile gaps (1.125rem). `NumberTiles` puts this class on the tile row.
 */
const TILE_SIZE =
  'md:*:size-14 md:*:text-2xl @max-[19rem]:gap-1.5 @max-[19rem]:*:size-[min(2.75rem,calc((100cqi_-_1.125rem)/4))] @max-[19rem]:*:text-[length:min(1.25rem,calc((100cqi_-_1.125rem)/9))]'

/**
 * In a narrow card, each label takes its own full-width row above its tiles (HIG: a stacked layout at large text sizes).
 *
 * @remarks The stacked grid is one column, so the 4 tiles get the full card width. The operators move to the label row.
 */
const STACK = '@max-[19rem]:col-span-1'

/** One line of the sum: a term and its value, on the parent's three columns. */
const LINE = `col-span-3 grid grid-cols-subgrid items-center ${STACK}`

/** On the loop step, the result's circle starts this long after the start's: the 550 ms draw, then a beat. */
const LOOP_SECOND_CIRCLE_MS = 650

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
  /** A new value plays the same step again (Play on a step shown at rest). */
  replay: number
  /** Shown over the empty stage before a run: a hint or the input error. */
  empty: ReactNode
}

/**
 * The active step as a column sum: the input, its digits biggest first, minus its digits smallest first, equals the difference.
 *
 * @remarks
 * - It is a description list, so a screen reader hears each line's name with its number.
 * - The layout is the same for every step, so the page never changes height between steps.
 * - The motion comes from {@link playStep} and {@link playArrival}. {@link Trail} and the playback bar choose the step.
 */
export function StageStep({ step, index, total, runId, arrival, animate, replay, empty }: StageStepProps) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLElement>(null)
  const desc = useRef<HTMLElement>(null)
  const asc = useRef<HTMLDivElement>(null)
  const result = useRef<HTMLDivElement>(null)
  const resultBox = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLSpanElement>(null)
  const shown = useRef<{ runId: number; index: number; replay: number } | null>(null)
  const celebrated = useRef<number | null>(null)
  const shownStep = step ?? PLACEHOLDER
  const isConstant = step?.result === KAPREKAR_CONSTANT
  // When the circle around 6174 starts, in ms. Null hides it. Set where the step's motion is planned.
  const [circleAt, setCircleAt] = useState<number | null>(null)
  // On the loop step ("Do one more round", from 6174), the start 6174 is circled first, then the result.
  const [startCircleAt, setStartCircleAt] = useState<number | null>(null)
  const loop = step?.input === KAPREKAR_CONSTANT
  const emptyBox = useRef<HTMLDivElement>(null)
  /** Where the field's slots sat in the empty stage, and the scroll then, so a new run's digits can fly from them. */
  const slots = useRef<{ rects: DOMRect[]; scrollY: number } | null>(null)

  // While the stage is empty, note where the slots sit after each render. The run's first paint reads it.
  useLayoutEffect(() => {
    if (step) return
    const row = emptyBox.current?.querySelector('#input-note-slots')
    slots.current = row ? { rects: [...row.children].map((el) => el.getBoundingClientRect()), scrollY: window.scrollY } : null
  })

  // Plan and start the motion for the shown step.
  useLayoutEffect(() => {
    const rows = {
      input: input.current,
      desc: desc.current,
      asc: asc.current,
      result: result.current,
      resultBox: resultBox.current,
      badge: badge.current,
    }
    if (!step || !root.current || Object.values(rows).some((el) => !el)) return

    // Step 1: decide the motion. A step picked with Back, Next or the trail paints at rest.
    // A run plays, also from `?n=`. The same step again (StrictMode runs effects twice) does nothing.
    const prev = shown.current
    shown.current = { runId, index, replay }
    const same = prev?.runId === runId && prev.index === index && prev.replay === replay
    let landedAt = AT_REST_LANDED_MS
    if (!same && !animate) {
      root.current.getAnimations({ subtree: true }).forEach((a) => a.cancel())
    } else if (!same) {
      const handoff = prev?.runId === runId && index === prev.index + 1
      // A run that starts while the slots show flies its digits in from them, moved by any scroll since.
      const noted = index === 0 && !handoff ? slots.current : null
      // Use the slots once: a later replay of step 1 fades in, with no slots on screen.
      slots.current = null
      const dy = noted ? window.scrollY - noted.scrollY : 0
      const from = noted?.rects.map((r) => new DOMRect(r.x, r.y - dy, r.width, r.height)) ?? null
      landedAt = playStep(root.current, rows as StageRows, step.digits, index === 0, handoff, from)
    }

    // Step 2: start the circle after the difference lands, with the badge.
    // On the loop step, the start 6174 is circled first and the result follows.
    if (!same) {
      setStartCircleAt(loop ? landedAt + CIRCLE_DELAY_MS : null)
      setCircleAt(arrival || loop ? landedAt + CIRCLE_DELAY_MS + (loop ? LOOP_SECOND_CIRCLE_MS : 0) : null)
    }

    // Step 3: the 6174 arrival plays once per run.
    if (arrival && celebrated.current !== runId) {
      celebrated.current = runId
      playArrival(rows as StageRows, landedAt)
    }
  }, [step, index, runId, arrival, loop, animate, replay])

  const label = `text-sm text-muted-foreground sm:text-base ${STACK}`
  const op = 'text-center font-mono text-2xl font-bold md:text-3xl'
  /** The same operator glyph on the label row, shown only in the stacked (narrow or large-text) layout. */
  const stackOp = 'ms-2 hidden align-middle font-mono text-xl font-bold @max-[19rem]:inline'

  return (
    <section
      id="stage-card"
      aria-labelledby="stage-heading"
      className="grid rounded-3xl border border-border bg-card p-3 sm:p-6 *:col-start-1 *:row-start-1"
    >
      <div ref={root} className={cn('@container flex flex-col gap-3 md:gap-4', !step && 'invisible')}>
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
          <h2 id="stage-heading" className="font-heading text-lg font-bold text-foreground md:text-xl">
            Step <span className="font-mono">{index + 1}</span> of <span className="font-mono">{total}</span>
          </h2>
          <Badge id="constant-badge" ref={badge} className={cn(!isConstant && 'invisible')}>
            Kaprekar&apos;s constant
          </Badge>
        </div>

        <dl
          id="stage-sum"
          className="grid grid-cols-[minmax(0,auto)_1.5rem_auto] items-center justify-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-3 @max-[19rem]:grid-cols-1"
        >
          {/* Extra room under the start number, so it reads as the input. A thin dashed divider sits half way
              in that room, unlike the solid 2 px bar of the subtraction. */}
          <div
            id="sum-start"
            className={cn(
              LINE,
              'relative mb-3 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[9px] after:border-t after:border-dashed after:border-border md:mb-4 md:after:-bottom-[14px]'
            )}
          >
            <dt className={label}>Start with</dt>
            <dd ref={input} className="col-start-3 @max-[19rem]:col-start-1">
              <HandCircle id="hand-circle-start" show={startCircleAt !== null} delay={startCircleAt ?? 0} animate={animate}>
                <NumberTiles digits={shownStep.digits} tone="outline" className={TILE_SIZE} />
              </HandCircle>
            </dd>
          </div>

          <div id="sum-biggest" className={LINE}>
            <dt className={label}>Biggest first</dt>
            <dd ref={desc} className="col-start-3 @max-[19rem]:col-start-1">
              <NumberTiles digits={shownStep.descendingDigits} className={TILE_SIZE} />
            </dd>
          </div>

          <div id="sum-smallest" className={LINE}>
            <dt className={label}>
              Smallest first<span className={cn(stackOp, 'text-primary')}>&minus;</span>
            </dt>
            <dd className="col-span-2 grid grid-cols-subgrid items-center @max-[19rem]:col-span-1">
              <span className={cn(op, 'text-primary @max-[19rem]:hidden')}>&minus;</span>
              <div ref={asc}>
                <NumberTiles digits={shownStep.ascendingDigits} className={TILE_SIZE} />
              </div>
            </dd>
          </div>

          {/* The rule sits in the top margin, clear of the circle's 8 px pad. Stacked, the row draws it, not the tiles' cell. */}
          <div
            id="sum-difference"
            className={cn(
              LINE,
              'relative mt-3.5 @max-[19rem]:before:absolute @max-[19rem]:before:inset-x-0 @max-[19rem]:before:-top-2.5 @max-[19rem]:before:h-0.5 @max-[19rem]:before:rounded-full @max-[19rem]:before:bg-border'
            )}
          >
            <dt className={label}>
              Difference<span className={cn(stackOp, 'text-foreground')}>=</span>
            </dt>
            <dd className="relative col-span-2 grid grid-cols-subgrid items-center before:absolute before:inset-x-0 before:-top-3.5 before:h-0.5 before:rounded-full before:bg-border @max-[19rem]:col-span-1 @max-[19rem]:before:hidden">
              <span className={cn(op, 'text-foreground @max-[19rem]:hidden')}>=</span>
              <div ref={resultBox} className="w-fit">
                <div ref={result}>
                  <HandCircle id="hand-circle" show={circleAt !== null} delay={circleAt ?? 0} animate={animate}>
                    <NumberTiles digits={shownStep.resultDigits} className={TILE_SIZE} />
                  </HandCircle>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {!step && <div id="stage-empty" ref={emptyBox} className="flex items-center justify-center p-2 text-center">{empty}</div>}
    </section>
  )
}
