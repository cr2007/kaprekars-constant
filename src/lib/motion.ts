/**
 * Shared motion basics: the reduced-motion check, the house easings, and
 * the easing math that the timelines sample.
 *
 * @packageDocumentation
 */

/** Strong ease-out, for things that enter or answer the user. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

/** Strong ease-in-out, for things that move from one place to another. */
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)'

/** An easing as a function from progress (0 to 1) to output (0 to 1, or past 1 for an overshoot). */
export type Ease = (p: number) => number

/**
 * True when the OS asks for reduced motion.
 *
 * @remarks CSS `@media` rules do not stop the Web Animations API, so every
 * `el.animate()` path calls this first.
 */
export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * A CSS `cubic-bezier()` as a function.
 *
 * @remarks Solves for t by bisection, which stays exact where the curve is flat.
 * @returns The eased value for a progress `x`; 0 and 1 at the ends.
 */
export function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const at = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  return (x) => {
    if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x))
    let lo = 0
    let hi = 1
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (at(mid, x1, x2) < x) lo = mid
      else hi = mid
    }
    return at((lo + hi) / 2, y1, y2)
  }
}

/**
 * An underdamped spring (mass 1) as a CSS `linear()` easing.
 *
 * @param stiffness - The spring constant.
 * @param damping - Must be below `2 * sqrt(stiffness)`, or the spring does not oscillate.
 * @returns The easing, and `ms`: the time to settle within 0.5%.
 * @example
 * ```ts
 * const glide = spring(170, 22) // about 530 ms, 0.7% overshoot
 * el.animate(frames, { duration: glide.ms, easing: glide.easing })
 * ```
 */
export function spring(stiffness: number, damping: number): { easing: string; ms: number } {
  const w0 = Math.sqrt(stiffness)
  const zeta = damping / (2 * w0)
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  const x = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))

  // Step 1: the last moment the spring is more than 0.5% from rest.
  let settle = 0
  for (let t = 0; t < 2; t += 0.001) if (Math.abs(1 - x(t)) > 0.005) settle = t

  // Step 2: 40 even samples over that time; the last one is exactly 1.
  const points = Array.from({ length: 40 }, (_, i) => (i === 39 ? 1 : x((settle * i) / 39)).toFixed(4))
  return { easing: `linear(${points.join(', ')})`, ms: Math.round(settle * 1000) }
}
