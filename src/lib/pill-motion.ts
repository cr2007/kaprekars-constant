/**
 * The trail pill's motion, apart from React: the glide spring, the lift, and the keyboard check.
 *
 * @packageDocumentation
 */
import { EASE_OUT, reducedMotion, spring } from '@/lib/motion'

/** The glide spring: half way at about 120 ms, so a tap answers at once, settled at about 530 ms. */
const GLIDE = spring(170, 22)
/** The pill's scale while it is lifted: pressed, dragged, or at the top of a tap's glide. */
export const LIFT = '1.04 1.1'

/**
 * A pill move within this many ms of a key event comes from the keyboard, so it jumps.
 *
 * @remarks Keyboard sources: radio arrows, the stage's arrow keys, Enter or Space on Back and Next.
 * Keyboard actions get no motion.
 */
const KEY_MS = 250
let lastKeyAt = -Infinity
for (const type of ['keydown', 'keyup']) {
  window.addEventListener(type, (event) => (lastKeyAt = event.timeStamp), true)
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
 * The pill and the step numbers it carries.
 *
 * @remarks The numbers move the other way, so they stay on top of the track numbers.
 * A digit turns to the pill's text color at the exact edge of the pill.
 */
export interface PillParts {
  /** The moving pill. */
  pill: HTMLElement
  /** The copy of the step numbers inside the pill. */
  copy: HTMLElement
}

/** Puts the pill at `x` px, or hands it back to CSS with null. */
export function place({ pill, copy }: PillParts, x: number | null) {
  pill.style.transform = x === null ? '' : `translateX(${x}px)`
  copy.style.transform = x === null ? '' : `translateX(${-x}px)`
}

/**
 * Animates the pill from `from` to `to` (px) on the spring.
 *
 * @remarks Reduced motion, or no distance, jumps with no animation.
 * @param sheen - The lift element. It rises in the first 30% of the glide and settles as the pill lands.
 * @param lift - The scale the lift starts from, which is the scale now.
 * @returns The pill's animation, or null when it did not animate.
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
      { scale: lift, easing: EASE_OUT },
      { scale: LIFT, offset: 0.3, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      { scale: '1 1' },
    ],
    { duration: GLIDE.ms }
  )
  // Step 4: the pill itself. Its animation is returned, so a caller can wait for the landing.
  return pill.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], options)
}
