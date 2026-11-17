import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { roughCircle } from '@/lib/rough-circle'
import { EASE_OUT, reducedMotion } from '@/lib/motion'

/** Draw time in ms for both loops, as rough-notation draws a circle. */
const DURATION_MS = 550

/**
 * The seed of the loops. A fixed seed gives the same loops on every
 * replay. Of six seeds that start upper left and clear "=" by 4 px or
 * more, this one drew the neatest loops at phone and desktop sizes.
 */
const SEED = 24116

/** Circle padding in px, the same as the insets of `.hand-circle` in index.css. */
const PAD_X = 11
/** Vertical circle padding in px. */
const PAD_Y = 8

/** A line drawing on a path with `pathLength={1}`: the dash grows from 0 to the full line. */
const DRAW: Keyframe[] = [
  { strokeDasharray: '1 2', strokeDashoffset: 1.01 },
  { strokeDasharray: '1 2', strokeDashoffset: 0 },
]

interface HandCircleProps {
  /** The svg's id. Each circle on the page needs its own. */
  id: string
  /** Draws the circle. */
  show: boolean
  /** Wait in ms before the line starts, so it follows other motion. */
  delay: number
  /** False shows the circle at rest, for a step that paints without motion. */
  animate: boolean
  children: ReactNode
}

/**
 * A hand-drawn circle around its children, as two pen loops from a fixed seed.
 *
 * @remarks
 * - It is decoration only: `aria-hidden` and absolutely placed, so it takes no layout space.
 * - Reduced motion shows it at rest.
 * - The loop math lives in {@link roughCircle}.
 */
export function HandCircle({ id, show, delay, animate, children }: HandCircleProps) {
  const target = useRef<HTMLSpanElement>(null)
  const sketch = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const el = target.current
    const svg = sketch.current
    if (!show || !el || !svg) return
    const paths = [...svg.querySelectorAll('path')]

    // Step 1: draw the loops for the target's size, and again before paint after each resize.
    const draw = () => {
      // offsetWidth ignores transforms, so the 6174 hop does not bend the loop.
      const w = el.offsetWidth + 2 * PAD_X
      const h = el.offsetHeight + 2 * PAD_Y
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      roughCircle(w / 2, h / 2, w, h, SEED).forEach((d, i) => paths[i].setAttribute('d', d))
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(el)

    // Step 2: one loop after the other, each with the house ease-out, timed by length, as rough-notation does.
    const lengths = paths.map((path) => path.getTotalLength())
    const total = lengths.reduce((sum, length) => sum + length, 0)
    let start = delay
    const drawings =
      !animate || reducedMotion()
        ? []
        : paths.map((path, i) => {
            const duration = (DURATION_MS * lengths[i]) / total
            const drawing = path.animate(DRAW, { duration, delay: start, easing: EASE_OUT, fill: 'backwards' })
            start += duration
            return drawing
          })
    return () => {
      observer.disconnect()
      drawings.forEach((drawing) => drawing.cancel())
    }
  }, [show, delay, animate])

  return (
    <span className="relative inline-flex">
      <span ref={target} className="inline-flex">
        {children}
      </span>
      {show && (
        <svg id={id} ref={sketch} aria-hidden className="hand-circle" preserveAspectRatio="none">
          <path pathLength={1} />
          <path pathLength={1} />
        </svg>
      )}
    </span>
  )
}
