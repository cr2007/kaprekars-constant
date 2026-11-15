/** Strong ease-out for things that enter or respond to the user. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

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

/** The rows of one step appear in order: the input, line 2, line 3, then the difference. */
export function stepTimeline(): StepTimeline {
  const descAt = ROW_GAP_MS
  const ascAt = descAt + ROW_GAP_MS
  const resultAt = ascAt + ROW_GAP_MS
  return { descAt, ascAt, resultAt, end: resultAt + RESULT_MS }
}

/** How long one step moves when it plays. Autoplay waits this long before the next step. */
export function stepMotionMs(): number {
  return stepTimeline().end
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
 * Plays one step on the stage: the input, line 2 and line 3 fade in one
 * after another, then the difference rises into place. Reduced motion:
 * the same order, opacity only. Returns the time in ms at which the step
 * is at rest.
 */
export function playStep(root: HTMLElement, rows: StageRows): number {
  // Step 1: stop every running animation, so a fast click never leaves a row half shown.
  root.getAnimations({ subtree: true }).forEach((a) => a.cancel())
  const plan = stepTimeline()

  // Step 2: the three tile rows, in reading order.
  fadeIn(rows.input, 0)
  fadeIn(rows.desc, plan.descAt)
  fadeIn(rows.asc, plan.ascAt)

  // Step 3: the difference lands last. Reduced motion drops the rise.
  if (reducedMotion()) {
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
