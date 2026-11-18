import { type PointerEvent, useRef } from 'react'
import { EASE_OUT, reducedMotion } from '@/lib/motion'

/** A touch must travel this many px sideways before it counts as a swipe (WWDC18 "Designing Fluid Interfaces": about 10 pt). */
const SLOP = 10
/** A release past this many px goes to the next or the previous step. */
const COMMIT_PX = 56
/** A flick faster than this, in px per ms, commits at any distance. */
const COMMIT_SPEED = 0.5
/** Past the first or the last step, the stage moves this part of the finger's travel. */
const EDGE_RESISTANCE = 0.2
/** The settle after a release, in ms. */
const SETTLE_MS = 200

/** A touch on the stage, from pointerdown until release. */
interface Swipe {
  id: number
  startX: number
  startY: number
  /** True once the touch moves sideways past the slop. */
  on: boolean
  /** The two latest samples, for the release speed. */
  last: { x: number; t: number }
  prev: { x: number; t: number }
}

/**
 * A sideways swipe on the stage: left shows the next step, right the previous one.
 *
 * @remarks
 * - Touch only: a mouse keeps text selection, and Back and Next do the same job.
 * - The stage follows the finger 1:1, with resistance past the first and the last step.
 * - A release past {@link COMMIT_PX}, or a flick, changes the step. The new step slides in from the side the finger moved to.
 * - A vertical move belongs to the page scroll (`touch-action: pan-y`), and ends the swipe.
 *
 * @param index - The step on the stage.
 * @param last - The index of the run's last step.
 * @param go - Shows a step at rest, and pauses autoplay.
 */
export function useStageSwipe(index: number, last: number, go: (index: number) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const swipe = useRef<Swipe | null>(null)

  /** Moves the stage sideways by `x` px. */
  const place = (x: number) => {
    if (ref.current) ref.current.style.transform = x ? `translateX(${x}px)` : ''
  }

  /** Animates the stage from the `from` transform to rest, faded in from `opacity`. */
  function settle(from: string, opacity = 1) {
    const el = ref.current
    if (!el || reducedMotion()) return
    el.animate([{ transform: from, opacity }, { transform: 'none', opacity: 1 }], { duration: SETTLE_MS, easing: EASE_OUT })
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || swipe.current) return
    // A new touch catches a settle mid-flight.
    ref.current?.getAnimations().forEach((a) => a.cancel())
    const sample = { x: event.clientX, t: event.timeStamp }
    swipe.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, on: false, last: sample, prev: sample }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const s = swipe.current
    if (!s || s.id !== event.pointerId) return
    const dx = event.clientX - s.startX

    // Step 1: wait for the slop. A move that is more vertical than sideways is a scroll.
    if (!s.on) {
      if (Math.abs(dx) < SLOP) return
      if (Math.abs(event.clientY - s.startY) > Math.abs(dx)) {
        swipe.current = null
        return
      }
      s.on = true
      event.currentTarget.setPointerCapture(event.pointerId)
      // Pause autoplay, so the step does not change under the finger.
      go(index)
    }

    // Step 2: follow the finger, with resistance where there is no step to go to.
    const edge = (dx > 0 && index === 0) || (dx < 0 && index >= last)
    place(edge ? dx * EDGE_RESISTANCE : dx)
    s.prev = s.last
    s.last = { x: event.clientX, t: event.timeStamp }
  }

  /**
   * Ends a touch.
   *
   * @param cancelled - True for pointercancel: the stage settles back on the same step.
   */
  function finish(event: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const s = swipe.current
    if (!s || s.id !== event.pointerId) return
    swipe.current = null
    if (!s.on) return

    // Step 1: read the distance and the release speed.
    const dx = event.clientX - s.startX
    const speed = (s.last.x - s.prev.x) / Math.max(1, s.last.t - s.prev.t)
    const dir = dx < 0 ? 1 : -1
    const target = index + dir
    const fast = Math.abs(speed) > COMMIT_SPEED && Math.sign(speed) === Math.sign(dx)
    const commit = !cancelled && target >= 0 && target <= last && (Math.abs(dx) > COMMIT_PX || fast)
    const shown = ref.current?.style.transform || 'none'
    place(0)

    // Step 2: change the step and slide it in from the side of travel, or settle back from where the finger let go.
    if (commit) {
      go(target)
      settle(`translateX(${dir * 2}rem)`, 0.4)
    } else settle(shown)
  }

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event, false),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    },
  }
}
