import { ChevronRight } from 'lucide-react'
import { type CSSProperties, type PointerEvent, useLayoutEffect, useRef, useState } from 'react'
import { pad4 } from '@/hooks/use-playback'
import type { KaprekarStep } from '@/lib/kaprekar'
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

/** Short ease with a small overshoot, for the snap after a tap or a release. */
const SNAP_EASE = 'cubic-bezier(0.34, 1.3, 0.64, 1)'
const SNAP_MS = 250
/** A press must travel this many px before it counts as a drag, not a tap. */
const DRAG_SLOP = 4

/**
 * A pill move this soon after a key press or release comes from the
 * keyboard (radio arrows, the stage's arrow keys, Enter or Space on Back
 * and Next). It jumps: keyboard actions get no motion.
 */
const KEY_MS = 250
let lastKeyAt = -Infinity
for (const type of ['keydown', 'keyup']) {
  window.addEventListener(type, (event) => (lastKeyAt = event.timeStamp), true)
}

/** The pill's horizontal offset in px as painted now, including a running animation. */
function paintedX(el: HTMLElement): number {
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
}

/** Animates the pill from `from` to `to` (px), or stops at once under reduced motion. */
function glide(pill: HTMLElement, from: number, to: number) {
  pill.getAnimations().forEach((a) => a.cancel())
  if (from === to || reducedMotion()) return
  pill.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], {
    duration: SNAP_MS,
    easing: SNAP_EASE,
  })
}

/**
 * The run as a scrubber: one native radio per step, labelled with the
 * number that step starts from, then the goal, 6174. A pill sits behind
 * the shown step. Tap a step, or press the pill and drag it: it follows
 * the pointer 1:1 and snaps to the nearest step on release. A tap on the
 * shown step stops autoplay there. Arrow keys move between steps as in
 * any radio group. Phones drop the goal label, so 8 steps keep a 44 px
 * target each. Render it only with a run: it reads `steps[0]`.
 */
export function Trail({ steps, index, reached, arrived, onPick }: TrailProps) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const optionEls = useRef<(HTMLLabelElement | null)[]>([])
  const drag = useRef<{ id: number; startX: number; from: number; moved: boolean } | null>(null)
  const glideFrom = useRef<number | null>(null)
  const shownIndex = useRef(index)
  const swallowClick = useRef(false)
  // The step nearest the pill during a drag. Null when no drag is in progress.
  const [hot, setHot] = useState<number | null>(null)
  const active = hot ?? index

  // Glide the pill to the new step after every change, unless a key moved it.
  useLayoutEffect(() => {
    const pill = pillRef.current
    if (!pill) return
    const to = index * pill.offsetWidth
    const from = glideFrom.current ?? shownIndex.current * pill.offsetWidth
    glideFrom.current = null
    shownIndex.current = index
    glide(pill, performance.now() - lastKeyAt < KEY_MS ? to : from, to)
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

    // Step 2: note where the pill is painted, even mid-glide. A tap leaves it alone.
    const from = paintedX(pill)
    drag.current = { id: event.pointerId, startX: event.clientX, from, moved: false }
  }

  /** Moves the pill 1:1 with the pointer, inside the track. */
  function onPointerMove(event: PointerEvent<HTMLFieldSetElement>) {
    const d = drag.current
    const pill = pillRef.current
    if (!d || !pill || d.id !== event.pointerId) return

    // Step 1: ignore jitter until the press travels past the slop.
    const dx = event.clientX - d.startX
    if (!d.moved && Math.abs(dx) < DRAG_SLOP) return
    if (!d.moved) {
      // Keep this pointer only once it drags: a capture from the press would send a tap's click to the fieldset, not the step.
      event.currentTarget.setPointerCapture(event.pointerId)
      pill.getAnimations().forEach((a) => a.cancel())
      d.moved = true
    }

    // Step 2: follow the pointer, clamped to the track, and mark the nearest step.
    const width = pill.offsetWidth
    const x = Math.min((steps.length - 1) * width, Math.max(0, d.from + dx))
    pill.style.transform = `translateX(${x}px)`
    setHot(Math.round(x / width))
  }

  /** Ends a drag: snaps to the nearest step, or back to the shown one when cancelled. */
  function endDrag(event: PointerEvent<HTMLFieldSetElement>, cancelled: boolean) {
    const d = drag.current
    const pill = pillRef.current
    if (!d || !pill || d.id !== event.pointerId) return

    // Step 1: clear the drag state. A tap ends here, and its click picks the step.
    drag.current = null
    if (!d.moved) return
    const x = paintedX(pill)
    pill.style.transform = ''
    setHot(null)

    // Step 2: a drag is not also a click on the step under the pointer.
    swallowClick.current = true

    // Step 3: snap, and show that step at rest. A new step glides from the layout effect; the same one glides here.
    const target = cancelled ? index : Math.round(x / pill.offsetWidth)
    if (target === index) glide(pill, x, index * pill.offsetWidth)
    else glideFrom.current = x
    if (!cancelled) onPick(target)
  }

  // scroll-mb: a focused step scrolls clear of the playback bar under it.
  return (
    <div id="trail" className="flex min-h-13 scroll-mb-24 items-center gap-1.5 max-sm:-mx-1">
      <fieldset
        className="relative grid min-w-0 flex-1 touch-pan-y rounded-full border border-border bg-card p-1 shadow-sm select-none"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
      >
        <legend className="sr-only">Steps from {pad4(steps[0].input)}</legend>
        {/* The pill rests at `--i` step widths from the start. A drag writes an inline px transform over it. */}
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 [transform:translateX(calc(var(--i)*100%))]"
          style={{ width: `calc((100% - 0.5rem) / ${steps.length})`, '--i': index } as CSSProperties}
        >
          <span className="block size-full rounded-full bg-primary shadow-sm" />
        </span>
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
            className={cn(
              'relative flex min-h-11 min-w-0 cursor-pointer touch-manipulation items-center justify-center rounded-full px-1 transition-colors duration-200 has-focus-visible:ring-2 has-focus-visible:ring-ring motion-reduce:transition-none',
              i === active ? 'text-primary-foreground' : 'text-foreground hover:bg-muted'
            )}
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
            {i <= reached ? (
              <span key="shown" className="stage-fade-in font-mono text-sm tabular-nums sm:text-lg">
                <span className="sr-only">Step {i + 1}, from </span>
                {pad4(s.input)}
              </span>
            ) : (
              <span key="hidden">
                <span className="sr-only">Step {i + 1}, not shown yet</span>
                <span aria-hidden className={i === active ? undefined : 'text-muted-foreground'}>
                  ····
                </span>
              </span>
            )}
          </label>
        ))}
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
