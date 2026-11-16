import { ChevronRight } from 'lucide-react'
import { type CSSProperties, type PointerEvent, useLayoutEffect, useRef, useState } from 'react'
import { pad4 } from '@/hooks/use-playback'
import type { KaprekarStep } from '@/lib/kaprekar'
import { fromKeyboard, glide, LIFT, paintedX, type PillParts, place } from '@/lib/pill-motion'
import { reducedMotion } from '@/lib/stage-motion'
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

/** A press must travel this many px before it counts as a drag, not a tap. */
const DRAG_SLOP = 4

/**
 * The run as a scrubber: one native radio per step, labelled with the
 * number that step starts from, then the goal, 6174. A pill sits behind
 * the shown step. Tap a step, or press the pill and drag it: it follows
 * the pointer 1:1 and snaps to the nearest step on release. The pill lifts
 * (a little bigger, a deeper shadow) while pressed, dragged, or gliding after
 * a tap or a release; autoplay glides without it, and keys jump. A tap on the
 * shown step stops autoplay there. Arrow keys move between steps as in
 * any radio group. Phones drop the goal label, so 8 steps keep a 44 px
 * target each. Render it only with a run: it reads `steps[0]`.
 */
export function Trail({ steps, index, reached, arrived, onPick }: TrailProps) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const sheenRef = useRef<HTMLSpanElement>(null)
  /** The pill and its numbers, once both are mounted. */
  const parts = (): PillParts | null =>
    pillRef.current && copyRef.current ? { pill: pillRef.current, copy: copyRef.current } : null
  const optionEls = useRef<(HTMLLabelElement | null)[]>([])
  const drag = useRef<{ id: number; startX: number; from: number; moved: boolean; stopKeys?: () => void } | null>(null)
  const glideFrom = useRef<number | null>(null)
  /** The pill's scale when the next glide starts, if it is lifted (a release after a drag). */
  const liftFrom = useRef<string | undefined>(undefined)
  const shownIndex = useRef(index)
  const swallowClick = useRef(false)
  // The step nearest the pill during a drag. Null when no drag is in progress.
  const [hot, setHot] = useState<number | null>(null)
  // The pill lifts while it is pressed, dragged, or gliding after a tap or a release.
  const [pressed, setPressed] = useState(false)
  const [gliding, setGliding] = useState(false)
  // Pressed or dragged: the pill holds its lift. A glide animates the lift itself, so it only deepens the shadow.
  const held = pressed || hot !== null
  const lifted = held || gliding

  /** A glide the user started: the pill lifts as it leaves and settles when it lands. `lift` is its scale now. */
  function liftGlide(p: PillParts, from: number, to: number, lift?: string) {
    const animation = glide(p, from, to, sheenRef.current ?? undefined, lift)
    if (!animation) return
    setGliding(true)
    animation.finished.catch(() => undefined).finally(() => setGliding(false))
  }

  // Glide the pill to the new step after every change. A tap or a release lifts it; autoplay does not; a key jumps.
  useLayoutEffect(() => {
    const p = parts()
    // During a drag the pill follows the pointer, not the stage.
    if (!p || drag.current?.moved) return
    const to = index * p.pill.offsetWidth
    const byUser = glideFrom.current !== null
    const from = glideFrom.current ?? shownIndex.current * p.pill.offsetWidth
    glideFrom.current = null
    const lift = liftFrom.current
    liftFrom.current = undefined
    shownIndex.current = index
    if (fromKeyboard()) glide(p, to, to)
    else if (byUser) liftGlide(p, from, to, lift)
    else glide(p, from, to)
  }, [index])

  /** Shows step `i`, and glides from where the pill is painted now. */
  function select(i: number) {
    const pill = pillRef.current
    if (pill && i !== index) glideFrom.current = paintedX(pill)
    onPick(i)
  }

  /** Starts a drag when the press lands on the shown step. */
  function onPointerDown(event: PointerEvent<HTMLFieldSetElement>) {
    swallowClick.current = false
    const pill = pillRef.current
    // Step 1: only a primary press on the shown step grabs the pill.
    if (!pill || event.button !== 0 || !optionEls.current[index]?.contains(event.target as Node)) return

    // Step 2: note where the pill is painted, even mid-glide, and lift it at once, so the press feels held.
    const from = paintedX(pill)
    drag.current = { id: event.pointerId, startX: event.clientX, from, moved: false }
    setPressed(true)
  }

  /** A press that leaves the track before it drags is not a drag: the pill settles. */
  function onPointerLeave(event: PointerEvent<HTMLFieldSetElement>) {
    const d = drag.current
    if (!d || d.moved || d.id !== event.pointerId) return
    drag.current = null
    setPressed(false)
  }

  /** Moves the pill 1:1 with the pointer, inside the track. */
  function onPointerMove(event: PointerEvent<HTMLFieldSetElement>) {
    const d = drag.current
    const p = parts()
    if (!d || !p || d.id !== event.pointerId) return

    // Step 1: ignore jitter until the press travels past the slop.
    const dx = event.clientX - d.startX
    if (!d.moved && Math.abs(dx) < DRAG_SLOP) return
    if (!d.moved) {
      // Keep this pointer only once it drags: a capture from the press would send a tap's click to the fieldset, not the step.
      event.currentTarget.setPointerCapture(event.pointerId)
      for (const el of [p.pill, p.copy]) el.getAnimations().forEach((a) => a.cancel())
      d.moved = true
      // A drag scrubs the run, so autoplay pauses on the shown step, as it does for a video.
      onPick(index)
      // Escape cancels the drag: the pill glides back to the shown step.
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finishDrag(d.id, true)
      window.addEventListener('keydown', onKey)
      d.stopKeys = () => window.removeEventListener('keydown', onKey)
    }

    // Step 2: follow the pointer, clamped to the track, and mark the nearest step.
    const width = p.pill.offsetWidth
    const x = Math.min((steps.length - 1) * width, Math.max(0, d.from + dx))
    place(p, x)
    setHot(Math.round(x / width))
  }

  /** Ends a drag: snaps to the nearest step, or back to the shown one when cancelled (pointercancel, Escape). */
  function finishDrag(pointerId: number, cancelled: boolean) {
    const d = drag.current
    const p = parts()
    if (!d || !p || d.id !== pointerId) return

    // Step 1: clear the drag state. A tap ends here, and its click picks the step.
    drag.current = null
    setPressed(false)
    d.stopKeys?.()
    if (!d.moved) return
    const x = paintedX(p.pill)
    place(p, null)
    setHot(null)

    // Step 2: a drag is not also a click on the step under the pointer. That click comes in the same task as the
    // release; one frame later the guard is off, so a later key press on a radio is not swallowed.
    swallowClick.current = true
    requestAnimationFrame(() => (swallowClick.current = false))

    // Step 3: snap, and show that step at rest. A new step glides from the layout effect; the same one glides here.
    const target = cancelled ? index : Math.round(x / p.pill.offsetWidth)
    // The pill is lifted from the drag: the glide starts its lift from there, so the scale never pops.
    if (target === index) liftGlide(p, x, index * p.pill.offsetWidth, LIFT)
    else {
      glideFrom.current = x
      liftFrom.current = LIFT
    }
    if (!cancelled) onPick(target)
  }

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
        className="glass-track relative grid min-w-0 flex-1 touch-pan-y rounded-full p-1 select-none [container-type:inline-size]"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, '--n': steps.length } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishDrag(event.pointerId, false)}
        onPointerCancel={(event) => finishDrag(event.pointerId, true)}
        onPointerLeave={onPointerLeave}
      >
        <legend className="sr-only">Steps from {pad4(steps[0].input)}</legend>
        {steps.map((s, i) => (
          <label
            key={i}
            id={`trail-step-${i + 1}`}
            ref={(el) => {
              optionEls.current[i] = el
            }}
            onClick={(event) => {
              // A drag ends with a click on the step under the pointer. Cancel it, so the snap target wins.
              if (!swallowClick.current) return
              swallowClick.current = false
              event.preventDefault()
            }}
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
        {/* The pill rests at `--i` step widths from the start. A drag writes inline px transforms over it.
            It sits above the labels and lets every pointer through. Its numbers move the other way, so they
            line up with the track's numbers and show only inside the pill. */}
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
              className="absolute inset-y-0 left-0 grid [transform:translateX(calc(var(--i)*-100%/var(--n)))]"
              style={{ width: `${steps.length * 100}%`, gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, '--n': steps.length } as CSSProperties}
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
