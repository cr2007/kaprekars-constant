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

/**
 * The pill and the step numbers it carries. The numbers move the other
 * way, so they stay on top of the numbers of the track and only the part
 * inside the pill shows: a digit turns to the pill's text color at the
 * exact edge of the pill, not when the pill is nearest.
 */
interface PillParts {
  pill: HTMLElement
  copy: HTMLElement
}

/** Puts the pill at `x` px, or hands it back to CSS with null. */
function place({ pill, copy }: PillParts, x: number | null) {
  pill.style.transform = x === null ? '' : `translateX(${x}px)`
  copy.style.transform = x === null ? '' : `translateX(${-x}px)`
}

/** Animates the pill from `from` to `to` (px), or stops at once under reduced motion. */
function glide({ pill, copy }: PillParts, from: number, to: number) {
  for (const el of [pill, copy]) el.getAnimations().forEach((a) => a.cancel())
  if (from === to || reducedMotion()) return
  const options = { duration: SNAP_MS, easing: SNAP_EASE }
  pill.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], options)
  copy.animate([{ transform: `translateX(${-from}px)` }, { transform: `translateX(${-to}px)` }], options)
}

/**
 * The run as a scrubber: one native radio per step, labelled with the
 * number that step starts from, then the goal, 6174. A pill sits behind
 * the shown step. Tap a step, or press the pill and drag it: it follows
 * the pointer 1:1, lifts a little, and snaps to the nearest step on release. A tap on the
 * shown step stops autoplay there. Arrow keys move between steps as in
 * any radio group. Phones drop the goal label, so 8 steps keep a 44 px
 * target each. Render it only with a run: it reads `steps[0]`.
 */
export function Trail({ steps, index, reached, arrived, onPick }: TrailProps) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  /** The pill and its numbers, once both are mounted. */
  const parts = (): PillParts | null =>
    pillRef.current && copyRef.current ? { pill: pillRef.current, copy: copyRef.current } : null
  const optionEls = useRef<(HTMLLabelElement | null)[]>([])
  const drag = useRef<{ id: number; startX: number; from: number; moved: boolean } | null>(null)
  const glideFrom = useRef<number | null>(null)
  const shownIndex = useRef(index)
  const swallowClick = useRef(false)
  // The step nearest the pill during a drag. Null when no drag is in progress.
  const [hot, setHot] = useState<number | null>(null)

  // Glide the pill to the new step after every change, unless a key moved it.
  useLayoutEffect(() => {
    const p = parts()
    if (!p) return
    const to = index * p.pill.offsetWidth
    const from = glideFrom.current ?? shownIndex.current * p.pill.offsetWidth
    glideFrom.current = null
    shownIndex.current = index
    glide(p, performance.now() - lastKeyAt < KEY_MS ? to : from, to)
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
    }

    // Step 2: follow the pointer, clamped to the track, and mark the nearest step.
    const width = p.pill.offsetWidth
    const x = Math.min((steps.length - 1) * width, Math.max(0, d.from + dx))
    place(p, x)
    setHot(Math.round(x / width))
  }

  /** Ends a drag: snaps to the nearest step, or back to the shown one when cancelled. */
  function endDrag(event: PointerEvent<HTMLFieldSetElement>, cancelled: boolean) {
    const d = drag.current
    const p = parts()
    if (!d || !p || d.id !== event.pointerId) return

    // Step 1: clear the drag state. A tap ends here, and its click picks the step.
    drag.current = null
    if (!d.moved) return
    const x = paintedX(p.pill)
    place(p, null)
    setHot(null)

    // Step 2: a drag is not also a click on the step under the pointer.
    swallowClick.current = true

    // Step 3: snap, and show that step at rest. A new step glides from the layout effect; the same one glides here.
    const target = cancelled ? index : Math.round(x / p.pill.offsetWidth)
    if (target === index) glide(p, x, index * p.pill.offsetWidth)
    else glideFrom.current = x
    if (!cancelled) onPick(target)
  }

  /** The text of step `i`, or dots before the run reaches it. On the pill, the dots take the pill's text color. */
  const number = (s: KaprekarStep, i: number, onPill = false) =>
    i <= reached ? (
      <span key="shown" className="stage-fade-in font-mono text-sm tabular-nums sm:text-lg">
        {pad4(s.input)}
      </span>
    ) : (
      <span key="hidden" aria-hidden className={onPill ? undefined : 'text-muted-foreground'}>
        ····
      </span>
    )
  const lifted = hot !== null

  // scroll-mb: a focused step scrolls clear of the playback bar under it.
  return (
    <div id="trail" className="flex min-h-13 scroll-mb-24 items-center gap-1.5 max-sm:-mx-1">
      <fieldset
        className="glass-track relative grid min-w-0 flex-1 touch-pan-y rounded-full p-1 select-none"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
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
            data-lifted={lifted || undefined}
            className="glass-sheen absolute inset-0 rounded-full bg-primary transition-[scale] duration-200 ease-out motion-reduce:transition-none"
            style={lifted && !reducedMotion() ? { scale: '1.04 1.1' } : undefined}
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
