import { type PointerEvent, useLayoutEffect, useRef, useState } from 'react'
import { fromKeyboard, glide, LIFT, paintedX, type PillParts, place } from '@/lib/pill-motion'

/** A press must travel this many px before it counts as a drag, not a tap. */
const DRAG_SLOP = 4

/** A press on the pill, from pointerdown until release. */
interface Press {
  id: number
  startX: number
  /** The pill's x when the press began, in px. */
  from: number
  moved: boolean
  /** Removes the Escape listener of a drag. */
  stopKeys?: () => void
}

/**
 * The trail pill's taps, drags and glides.
 *
 * @remarks
 * - A tap on a step glides the pill there with a lift. Autoplay glides
 *   without the lift, and a key move jumps.
 * - A press on the shown step lifts the pill. Past 4 px it is a drag: the
 *   pill follows the pointer, autoplay pauses, and the release snaps to the
 *   nearest step. Escape or pointercancel snaps back.
 * - A drag ends with a click on the step under the pointer; the click guard
 *   swallows it, so the snap target wins.
 *
 * @param index - The step on the stage.
 * @param count - The number of steps in the trail.
 * @param onPick - Shows a step at rest, and pauses autoplay.
 */
export function usePillDrag(index: number, count: number, onPick: (index: number) => void) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const sheenRef = useRef<HTMLSpanElement>(null)
  const optionEls = useRef<(HTMLLabelElement | null)[]>([])
  const press = useRef<Press | null>(null)
  const glideFrom = useRef<number | null>(null)
  /** The pill's scale when the next glide starts, if it is lifted (a release after a drag). */
  const liftFrom = useRef<string | undefined>(undefined)
  const shownIndex = useRef(index)
  const swallowClick = useRef(false)
  // The step nearest the pill during a drag. Null when no drag is in progress.
  const [hot, setHot] = useState<number | null>(null)
  const [pressed, setPressed] = useState(false)
  const [gliding, setGliding] = useState(false)
  // Pressed or dragged: the pill holds its lift. A glide animates the lift itself, so it only deepens the shadow.
  const held = pressed || hot !== null

  /** The pill and its numbers, once both are mounted. */
  const parts = (): PillParts | null =>
    pillRef.current && copyRef.current ? { pill: pillRef.current, copy: copyRef.current } : null

  /** A glide the user started: the pill lifts as it leaves and settles as it lands. `lift` is its scale now. */
  function liftGlide(p: PillParts, from: number, to: number, lift?: string) {
    const animation = glide(p, from, to, sheenRef.current ?? undefined, lift)
    if (!animation) return
    setGliding(true)
    animation.finished.catch(() => undefined).finally(() => setGliding(false))
  }

  // Glide the pill to each new step: lifted after a tap or a release, plain for autoplay, a jump for a key.
  useLayoutEffect(() => {
    const p = parts()
    // During a drag the pill follows the pointer, not the stage.
    if (!p || press.current?.moved) return
    const to = index * p.pill.offsetWidth
    const byUser = glideFrom.current !== null
    const from = glideFrom.current ?? shownIndex.current * p.pill.offsetWidth
    const lift = liftFrom.current
    glideFrom.current = null
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

  /** Lifts the pill when a primary press lands on the shown step. */
  function onPointerDown(event: PointerEvent<HTMLElement>) {
    swallowClick.current = false
    const pill = pillRef.current
    if (!pill || event.button !== 0 || !optionEls.current[index]?.contains(event.target as Node)) return
    // Note where the pill is painted, even mid-glide.
    press.current = { id: event.pointerId, startX: event.clientX, from: paintedX(pill), moved: false }
    setPressed(true)
  }

  /** A press that leaves the track before it drags is not a drag: the pill settles. */
  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    const d = press.current
    if (!d || d.moved || d.id !== event.pointerId) return
    press.current = null
    setPressed(false)
  }

  /** Moves the pill 1:1 with the pointer, inside the track. */
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const d = press.current
    const p = parts()
    if (!d || !p || d.id !== event.pointerId) return

    // Step 1: ignore jitter until the press travels past the slop.
    const dx = event.clientX - d.startX
    if (!d.moved && Math.abs(dx) < DRAG_SLOP) return

    // Step 2: the drag starts. Capture the pointer only now: a capture from the press would send a tap's
    // click to the track, not the step. Pause autoplay, and let Escape cancel.
    if (!d.moved) {
      event.currentTarget.setPointerCapture(event.pointerId)
      for (const el of [p.pill, p.copy]) el.getAnimations().forEach((a) => a.cancel())
      d.moved = true
      onPick(index)
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finishDrag(d.id, true)
      window.addEventListener('keydown', onKey)
      d.stopKeys = () => window.removeEventListener('keydown', onKey)
    }

    // Step 3: follow the pointer, clamped to the track, and mark the nearest step.
    const width = p.pill.offsetWidth
    const x = Math.min((count - 1) * width, Math.max(0, d.from + dx))
    place(p, x)
    setHot(Math.round(x / width))
  }

  /**
   * Ends a press. A tap ends here, and its click picks the step.
   *
   * @param cancelled - True for pointercancel and Escape: the pill snaps back to the shown step.
   */
  function finishDrag(pointerId: number, cancelled: boolean) {
    const d = press.current
    const p = parts()
    if (!d || !p || d.id !== pointerId) return

    // Step 1: clear the press.
    press.current = null
    setPressed(false)
    d.stopKeys?.()
    if (!d.moved) return
    const x = paintedX(p.pill)
    place(p, null)
    setHot(null)

    // Step 2: guard against the click that comes with the release (same task); clear the guard a frame
    // later, so a later key press on a radio is not swallowed.
    swallowClick.current = true
    requestAnimationFrame(() => (swallowClick.current = false))

    // Step 3: snap. The glide starts its lift where the drag left it, so the scale never pops.
    const target = cancelled ? index : Math.round(x / p.pill.offsetWidth)
    if (target === index) liftGlide(p, x, index * p.pill.offsetWidth, LIFT)
    else {
      glideFrom.current = x
      liftFrom.current = LIFT
    }
    if (!cancelled) onPick(target)
  }

  /** The ref callback for the label of step `i`: a press counts only on the shown step's label. */
  const optionRef = (i: number) => (el: HTMLLabelElement | null) => {
    optionEls.current[i] = el
  }

  /** On a step's label: cancels the click that ends a drag. */
  function onLabelClick(event: { preventDefault: () => void }) {
    if (!swallowClick.current) return
    swallowClick.current = false
    event.preventDefault()
  }

  return {
    pillRef,
    copyRef,
    sheenRef,
    optionRef,
    held,
    lifted: held || gliding,
    select,
    onLabelClick,
    trackHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => finishDrag(event.pointerId, false),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => finishDrag(event.pointerId, true),
      onPointerLeave,
    },
  }
}
