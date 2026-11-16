/** Strong ease-out for things that enter or respond to the user. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

/** Strong ease-in-out for things that move from one place to another on screen. */
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)'

/** The last result moves up into the input row over this time. */
const HANDOFF_MS = 300

/** One row fades in over this time. */
const FADE_MS = 200
/** From the start of one row's fade to the start of the next. */
const ROW_GAP_MS = 250
/** The difference rises into place over this time. */
const RESULT_MS = 200
/** One 6174 tile hops over this time. */
const ARRIVE_MS = 450
/** The 6174 tiles start their hops this far apart. */
const ARRIVE_STAGGER_MS = 40
/** The badge comes in this long after the hop starts. */
const BADGE_DELAY_MS = 250
/** The 6174 arrival from its start until the last tile lands. */
export const ARRIVAL_MS = ARRIVE_MS + 3 * ARRIVE_STAGGER_MS
/** A step shown at rest lands its 6174 hop this long after it paints. */
export const AT_REST_LANDED_MS = 300
/** The hand-drawn circle starts this long after the difference lands, with the badge. */
export const CIRCLE_DELAY_MS = 250

/**
 * True when the OS asks for reduced motion. CSS `@media` rules do not
 * stop Web Animations API calls, so every `el.animate()` path checks this.
 */
export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** When each row of one step starts, in ms from the step's start. */
export interface StepTimeline {
  /** Line 2, biggest first. */
  descAt: number
  /** Line 3, smallest first. */
  ascAt: number
  /** The difference starts to land. */
  resultAt: number
  /** The whole step is at rest. */
  end: number
}

/**
 * The rows of one step appear in order: the input, line 2, line 3, then
 * the difference. With `handoff`, line 2 waits until the last result has
 * moved into the input row.
 */
export function stepTimeline(handoff: boolean): StepTimeline {
  const descAt = handoff ? HANDOFF_MS : ROW_GAP_MS
  const ascAt = descAt + ROW_GAP_MS
  const resultAt = ascAt + ROW_GAP_MS
  return { descAt, ascAt, resultAt, end: resultAt + RESULT_MS }
}

/**
 * How long step `index` moves when autoplay arrives at it: step 1 starts
 * a run, every later step arrives by the handoff. Autoplay waits this long.
 */
export function stepMotionMs(index: number): number {
  return stepTimeline(index > 0 && !reducedMotion()).end
}

/** The stage parts that move. Each tile row wraps one `NumberTiles`. */
export interface StageRows {
  input: HTMLElement
  desc: HTMLElement
  asc: HTMLElement
  /** The tile row of the difference. The 6174 hop moves its tiles. */
  result: HTMLElement
  /** The box around the difference. It lands with the difference. */
  resultBox: HTMLElement
  badge: HTMLElement
}

/** The colored tiles that `NumberTiles` draws inside a row. */
export function tilesOf(row: HTMLElement): HTMLElement[] {
  return [...row.querySelectorAll<HTMLElement>('[aria-hidden="true"] > span')]
}

/** Fades `el` in. Opacity only, so it is also the reduced-motion path. */
function fadeIn(el: HTMLElement, delay: number, duration = FADE_MS): Animation {
  return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, easing: EASE_OUT, fill: 'backwards' })
}

/**
 * FLIP: animates `el` from a rect measured before a DOM change (`first`)
 * to where it sits now. Returns null when nothing moved.
 */
export function flipFrom(el: HTMLElement, first: DOMRect, duration: number): Animation | null {
  const last = el.getBoundingClientRect()
  const dx = first.left - last.left
  const dy = first.top - last.top
  if (dx === 0 && dy === 0) return null
  return el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
    duration,
    easing: EASE_IN_OUT,
    fill: 'backwards',
  })
}

/**
 * Plays one step on the stage. With `handoff`, the last result moves up
 * into the input row, so the eye sees it become the next input; otherwise
 * the input fades in. Then line 2 and line 3 fade in, and the difference
 * rises into place. Reduced motion: the same order, opacity only. Returns
 * the time in ms at which the step is at rest.
 */
export function playStep(root: HTMLElement, rows: StageRows, handoff: boolean): number {
  // Step 1: stop every running animation first, so the rect below is the
  // real layout and a fast click never leaves a row half shown.
  root.getAnimations({ subtree: true }).forEach((a) => a.cancel())
  const reduced = reducedMotion()
  const moves = handoff && !reduced
  const plan = stepTimeline(moves)

  // Step 2: the input. The old result still shows the last step's number,
  // so measure it before React's new rows move anything.
  if (moves) flipFrom(rows.input, rows.result.getBoundingClientRect(), HANDOFF_MS)
  else fadeIn(rows.input, 0)

  // Step 3: lines 2 and 3, in reading order.
  fadeIn(rows.desc, plan.descAt)
  fadeIn(rows.asc, plan.ascAt)

  // Step 4: the difference lands last. Reduced motion drops the rise.
  if (reduced) {
    fadeIn(rows.resultBox, plan.resultAt, RESULT_MS)
  } else {
    rows.resultBox.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: RESULT_MS,
      delay: plan.resultAt,
      easing: EASE_OUT,
      fill: 'backwards',
    })
  }
  return plan.end
}

/**
 * The 6174 arrival: the result tiles hop one after another from their
 * bottom edge, then the badge comes in. Reduced motion: the badge fades
 * in and nothing scales.
 */
export function playArrival(rows: StageRows, delay: number) {
  if (reducedMotion()) {
    fadeIn(rows.badge, delay + BADGE_DELAY_MS)
    return
  }
  const origin = '50% 100%'
  tilesOf(rows.result).forEach((tile, i) => {
    tile.animate(
      [
        // EASE_OUT on each segment: a hop up, then a settle.
        { transform: 'scale(1)', transformOrigin: origin, easing: EASE_OUT },
        { transform: 'scale(1.12)', transformOrigin: origin, offset: 0.4, easing: EASE_OUT },
        { transform: 'scale(1)', transformOrigin: origin },
      ],
      { duration: ARRIVE_MS, delay: delay + i * ARRIVE_STAGGER_MS }
    )
  })
  rows.badge.animate([{ opacity: 0, transform: 'scale(0.95)' }, { opacity: 1, transform: 'none' }], {
    duration: FADE_MS,
    delay: delay + BADGE_DELAY_MS,
    easing: EASE_OUT,
    fill: 'backwards',
  })
}
