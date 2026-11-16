import { reducedMotion } from '@/lib/stage-motion'

/*
  The trail pill's motion, apart from React: the spring it glides on, the
  lift, and the check that keeps keyboard moves instant.
*/

/**
 * A spring with mass 1 as a CSS `linear()` easing and its duration: the
 * time it takes to settle within 0.5%. Only for an underdamped spring
 * (damping below 2 * sqrt(stiffness)). The trail uses stiffness 170 and
 * damping 22 (ratio 0.84): half way at about 120 ms, so a tap answers at
 * once, then it eases in with 0.7% overshoot and settles at about 530 ms.
 */
export function spring(stiffness: number, damping: number): { easing: string; ms: number } {
  const w0 = Math.sqrt(stiffness)
  const zeta = damping / (2 * w0)
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  const x = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
  // Step 1: the time to settle within 0.5%, found once at load.
  let settle = 0
  for (let t = 0; t < 2; t += 0.001) if (Math.abs(1 - x(t)) > 0.005) settle = t
  // Step 2: 40 samples over that time; the last one is exactly 1.
  const points = Array.from({ length: 40 }, (_, i) => (i === 39 ? 1 : x((settle * i) / 39)).toFixed(4))
  return { easing: `linear(${points.join(', ')})`, ms: Math.round(settle * 1000) }
}
const GLIDE = spring(170, 22)
/** The pill's scale while it is lifted: pressed, dragged, or at the top of a tap's glide. */
export const LIFT = '1.04 1.1'

/**
 * A pill move this soon after a key press or release comes from the
 * keyboard (radio arrows, the stage's arrow keys, Enter or Space on Back
 * and Next). It jumps: keyboard actions get no motion.
 */
const KEY_MS = 250
let lastKeyAt = -Infinity
// Guarded, so the module also loads in unit tests, where there is no window.
if (typeof window !== 'undefined') {
  for (const type of ['keydown', 'keyup']) {
    window.addEventListener(type, (event) => (lastKeyAt = event.timeStamp), true)
  }
}

/** True when a key press or release came just now: the pill then jumps. */
export function fromKeyboard(): boolean {
  return performance.now() - lastKeyAt < KEY_MS
}

/** The pill's horizontal offset in px as painted now, including a running animation. */
export function paintedX(el: HTMLElement): number {
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
}

/**
 * The pill and the step numbers it carries. The numbers move the other
 * way, so they stay on top of the numbers of the track and only the part
 * inside the pill shows: a digit turns to the pill's text color at the
 * exact edge of the pill, not when the pill is nearest.
 */
export interface PillParts {
  pill: HTMLElement
  copy: HTMLElement
}

/** Puts the pill at `x` px, or hands it back to CSS with null. */
export function place({ pill, copy }: PillParts, x: number | null) {
  pill.style.transform = x === null ? '' : `translateX(${x}px)`
  copy.style.transform = x === null ? '' : `translateX(${-x}px)`
}

/**
 * Animates the pill from `from` to `to` (px) on the spring, or stops at
 * once under reduced motion. With `sheen`, the glide carries the lift in
 * the same motion: the pill rises in the first 30% from `lift` (its scale
 * now) and settles back to rest as it lands. Returns the pill's animation.
 */
export function glide({ pill, copy }: PillParts, from: number, to: number, sheen?: HTMLElement, lift = '1 1'): Animation | null {
  // Step 1: stop any glide in flight. Reduced motion, or no distance, jumps.
  for (const el of [pill, copy, sheen]) el?.getAnimations().forEach((a) => a.cancel())
  if (from === to || reducedMotion()) return null

  // Step 2: the numbers move against the pill on the same spring, so they stay on the track's numbers.
  const options = { duration: GLIDE.ms, easing: GLIDE.easing }
  copy.animate([{ transform: `translateX(${-from}px)` }, { transform: `translateX(${-to}px)` }], options)
  // Step 3: the lift rises in the first 30% of the glide and settles as the pill lands.
  sheen?.animate(
    [
      { scale: lift, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      { scale: LIFT, offset: 0.3, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      { scale: '1 1' },
    ],
    { duration: GLIDE.ms }
  )
  // Step 4: the pill itself. Its animation is returned, so a caller can wait for the landing.
  return pill.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], options)
}
