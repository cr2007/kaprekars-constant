/** Strong ease-out for things that enter or respond to the user. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

/** Strong ease-in-out for things that move from one place to another on screen. */
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)'

/** The last result moves up into the input row over this time. */
const HANDOFF_MS = 300
/**
 * A new run: each digit flies from its slot in the empty stage to its
 * place in the input row, over this time, this far apart. The copies drop
 * only once the last one lands, so the start does not feel rushed.
 */
const SLOT_MS = 400
const SLOT_STAGGER_MS = 50
export const SLOTS_IN_MS = SLOT_MS + 3 * SLOT_STAGGER_MS

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
 * How long step `index` with these input digits moves when autoplay
 * arrives at it: step 1 starts a run (its digits fly in from the slots;
 * a replay fades them in, sooner, so the wait is never short), and every
 * later step arrives by the handoff. Autoplay waits this long.
 */
export function stepMotionMs(digits: number[], index: number): number {
  if (reducedMotion()) return stepTimeline(false).end
  return sortTimeline(digits, index === 0, index > 0 ? HANDOFF_MS : SLOTS_IN_MS).end
}

/* ---------------------------------------------------------------------------
 * The sort (M-2h2). A copy of the input drops into line 2 and into line 3.
 * Then each line sorts in place: a fill inside each tile rises to its digit
 * (a 9 fills the tile, a 0 stays empty), the tiles slide into order in their
 * own line, and the fills drain. Where paths cross, the bigger digit passes
 * in front. Step 1 plays at full time; later steps at 60%.
 * ------------------------------------------------------------------------- */

/**
 * A spring ease-out as CSS `linear()`: stiffness 456, damping 27.3, mass 1.
 * It overshoots by 7% and settles in about 390 ms. The copies drop on it.
 */
const DROP_SPRING =
  'linear(0, 0.06, 0.187, 0.356, 0.52, 0.67, 0.805, 0.905, 0.978, 1.027, 1.056, 1.069, 1.071, 1.065, 1.054, 1.043, 1.031, 1.021, 1.012, 1.005, 1.001, 0.997, 0.996, 0.995, 1)'
/** Material 3 emphasized, for the slide in the line. */
const EMPHASIZED = bezier(0.2, 0, 0, 1)
/** Fill, slide and drain times in ms at step 1, and the gaps between them. */
const FILL_MS = 200
const SLIDE_AT_MS = 290
const SLIDE_MS = 300
const DRAIN_AT_MS = 60
/** Places of equal rank start this far apart, biggest first in line 2. */
const RANK_MS = 30
/** The fill is the page text color at this opacity: it raises the digit contrast on the tile. */
const FILL_OPACITY = 0.3

type Ease = (p: number) => number

/** A CSS `cubic-bezier()` as a function, solved by bisection (robust where the slope is flat). */
function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
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

/** A tile pose at time `t`: `x` in places (0 to 3), `s` the scale. */
export interface TrackPoint {
  t: number
  x: number
  s: number
}

/** One sorted line. Arrays are per final place. */
export interface SortLine {
  /** The input slot of the digit in each final place. */
  order: number[]
  /** When the copy of the source row drops into this line. */
  copyAt: number
  /** The poses of the tile in each final place. The first pose is where the copy lands. */
  tracks: TrackPoint[][]
  /** When each fill starts to rise, and when it starts to drain. */
  fillAt: number[]
  drainAt: number[]
  fillMs: number
  /** The line is at rest. */
  end: number
}

export interface SortTimeline {
  copyMs: number
  desc: SortLine
  asc: SortLine
  resultAt: number
  end: number
}

/** A stable sort of the input slots: equal digits keep their order. */
const stableOrder = (digits: number[], desc: boolean) =>
  digits.map((_, slot) => slot).sort((a, b) => (desc ? digits[b] - digits[a] : digits[a] - digits[b]))

/** The poses of one line that sorts from input order, from `t0`, with all times times `k`. */
function sortLine(digits: number[], desc: boolean, copyAt: number, t0: number, k: number): SortLine {
  const order = stableOrder(digits, desc)
  const line: SortLine = { order, copyAt, tracks: [], fillAt: [], drainAt: [], fillMs: k * FILL_MS, end: t0 }
  order.forEach((slot, i) => {
    const d = digits[slot]
    // Equal digits share one rank, so they start together and never pass each other.
    const r = order.findIndex((other) => digits[other] === d)
    const slideAt = t0 + k * (SLIDE_AT_MS + r * RANK_MS)
    // The bigger digit grows a little as it passes, the smaller one shrinks: +6% for a 9, -14% for a 0.
    const bump = -0.14 + (0.2 * d) / 9
    const n = Math.round((k * SLIDE_MS) / 16)
    line.tracks.push(
      slot === i
        ? [{ t: slideAt, x: i, s: 1 }]
        : Array.from({ length: n + 1 }, (_, j) => {
            const q = j / n
            return { t: slideAt + q * k * SLIDE_MS, x: slot + (i - slot) * EMPHASIZED(q), s: 1 + 4 * bump * q * (1 - q) }
          })
    )
    line.fillAt.push(t0 + k * r * RANK_MS)
    line.drainAt.push(slideAt + k * (SLIDE_MS + DRAIN_AT_MS))
    line.end = Math.max(line.end, slideAt + k * (SLIDE_MS + DRAIN_AT_MS + FILL_MS))
  })
  return line
}

/**
 * The timeline of one step. The input row is in place at `inputMs`. Then
 * both copies drop in input order, line 2 sorts biggest first, line 3
 * smallest first, and the difference lands. `teach` is step 1, at full
 * time; later steps run at 60%.
 */
export function sortTimeline(digits: number[], teach: boolean, inputMs: number): SortTimeline {
  const k = teach ? 1 : 0.6
  const copyMs = teach ? 260 : 180
  const pause = teach ? 80 : 30
  const descCopy = inputMs
  const ascCopy = descCopy + copyMs / 2
  const desc = sortLine(digits, true, descCopy, ascCopy + copyMs + pause, k)
  const asc = sortLine(digits, false, ascCopy, desc.end + pause, k)
  const resultAt = asc.end + pause
  return { copyMs, desc, asc, resultAt, end: resultAt + RESULT_MS }
}

/** Moves `el` from an offset back to where it is. It adds to the element's other moves. */
function slide(el: HTMLElement, dx: number, dy: number, delay: number, duration: number): Animation {
  return el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
    delay,
    duration,
    easing: DROP_SPRING,
    fill: 'backwards',
    composite: 'add',
  })
}

/**
 * Plays one sorted line. Each tile shows when its copy leaves, drops from
 * its source tile to its first place, follows its track (transform only),
 * and fills to its digit. Measure every rect before this runs.
 */
function playLine(tiles: HTMLElement[], rest: DOMRect[], sources: DOMRect[], line: SortLine, copyMs: number) {
  const pitch = rest[1].left - rest[0].left
  tiles.forEach((tile, i) => {
    // Step 1: invisible until its copy leaves, then a drop to its first place.
    const track = line.tracks[i]
    const start = rest[Math.round(track[0].x)]
    const src = sources[line.order[i]]
    tile.animate([{ opacity: 0 }, { opacity: 1 }], { delay: line.copyAt, duration: 1, fill: 'backwards' })
    slide(tile, src.left - start.left, src.top - start.top, line.copyAt, copyMs)

    // Step 2: the track, as offsets from the tile's place at rest. Linear between samples.
    if (track.length > 1) {
      const t0 = track[0].t
      const span = track[track.length - 1].t - t0
      const frames = track.map((p) => ({ offset: (p.t - t0) / span, transform: `translateX(${(p.x - i) * pitch}px) scale(${p.s})` }))
      tile.animate(frames, { delay: t0, duration: span, fill: 'backwards', composite: 'add' })
    }
    fillTile(tile, line.fillAt[i], line.drainAt[i], line.fillMs)
  })
}

/**
 * A fill inside the tile rises to d / 9 of its height, stays while the
 * tiles slide, then drains. The tile gets `isolation`, so the fill paints
 * over its background and under its digit, and a z-index by digit, so the
 * bigger digit passes in front. The fill removes itself, and the tile gets
 * its own style back, when the fill ends or is cancelled.
 */
function fillTile(tile: HTMLElement, at: number, drainAt: number, ms: number) {
  const d = Number(tile.textContent)
  const saved = tile.style.cssText
  tile.style.position = 'relative'
  tile.style.isolation = 'isolate'
  tile.style.overflow = 'hidden'
  tile.style.zIndex = String(d)
  const fill = document.createElement('span')
  fill.style.cssText = `position:absolute;inset:0;z-index:-1;pointer-events:none;background:var(--foreground);opacity:${FILL_OPACITY};transform-origin:bottom;transform:scaleY(0)`
  tile.append(fill)
  const total = drainAt + ms - at
  const level = `scaleY(${d / 9})`
  fill
    .animate(
      [
        { transform: 'scaleY(0)', easing: EASE_OUT },
        { transform: level, offset: ms / total },
        { transform: level, offset: (drainAt - at) / total, easing: EASE_OUT },
        { transform: 'scaleY(0)' },
      ],
      { delay: at, duration: total, fill: 'both' }
    )
    .finished.catch(() => undefined)
    .finally(() => {
      fill.remove()
      tile.style.cssText = saved
    })
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
 * Each input tile flies from its slot in the empty stage (`slots`, measured
 * before the stage changed) to its place, one after another: a shared
 * element move, so the typed digits become the run.
 */
function flyFromSlots(tiles: HTMLElement[], slots: DOMRect[]) {
  // The tile at the front of the move leaves first, so no tile passes over one that has landed.
  const right = slots[0] && tiles[0] ? tiles[0].getBoundingClientRect().left > slots[0].left : true
  tiles.forEach((tile, i) => {
    const first = slots[i]
    const last = tile.getBoundingClientRect()
    if (!first) return
    const scale = first.width / last.width
    const rank = right ? tiles.length - 1 - i : i
    tile.animate(
      [
        { transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${scale})`, transformOrigin: '0 0' },
        { transform: 'none', transformOrigin: '0 0' },
      ],
      { duration: SLOT_MS, delay: rank * SLOT_STAGGER_MS, easing: EASE_IN_OUT, fill: 'backwards' }
    )
  })
}

/**
 * Plays one step on the stage. With `handoff`, the last result moves up
 * into the input row, so the eye sees it become the next input. With
 * `slots`, a new run's digits fly in from the slots of the empty stage.
 * Otherwise the input fades in. Then the copies drop and lines 2 and 3 sort in place
 * (see `sortTimeline`), and the difference rises into place. Reduced
 * motion: the input, line 2, line 3 and the difference fade in, in that
 * order. Returns the time in ms at which the step is at rest.
 */
export function playStep(
  root: HTMLElement,
  rows: StageRows,
  digits: number[],
  teach: boolean,
  handoff: boolean,
  slots: DOMRect[] | null = null
): number {
  // Step 1: stop every running animation first, so the rects below are the
  // real layout and a fast click never leaves a tile mid-flight.
  root.getAnimations({ subtree: true }).forEach((a) => a.cancel())

  // Step 2: reduced motion fades the rows in reading order.
  if (reducedMotion()) {
    const plan = stepTimeline(false)
    fadeIn(rows.input, 0)
    fadeIn(rows.desc, plan.descAt)
    fadeIn(rows.asc, plan.ascAt)
    fadeIn(rows.resultBox, plan.resultAt, RESULT_MS)
    return plan.end
  }

  // Step 3: measure every tile and the old result before anything moves.
  const rect = (els: HTMLElement[]) => els.map((el) => el.getBoundingClientRect())
  const tiles = { input: tilesOf(rows.input), desc: tilesOf(rows.desc), asc: tilesOf(rows.asc) }
  const [input, desc, asc] = [rect(tiles.input), rect(tiles.desc), rect(tiles.asc)]
  const from = rows.result.getBoundingClientRect()
  const plan = sortTimeline(digits, teach, handoff ? HANDOFF_MS : slots ? SLOTS_IN_MS : FADE_MS)

  // Step 4: the input. The old result becomes this step's input, the digits fly in from the slots, or the input fades in.
  if (handoff) flipFrom(rows.input, from, HANDOFF_MS)
  else if (slots) flyFromSlots(tiles.input, slots)
  else fadeIn(rows.input, 0)

  // Step 5: line 2 copies the input row; line 3 copies line 2 while it still shows input order.
  playLine(tiles.desc, desc, input, plan.desc, plan.copyMs)
  playLine(tiles.asc, asc, desc, plan.asc, plan.copyMs)

  // Step 6: the difference lands once both lines are sorted.
  rows.resultBox.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
    duration: RESULT_MS,
    delay: plan.resultAt,
    easing: EASE_OUT,
    fill: 'backwards',
  })
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
