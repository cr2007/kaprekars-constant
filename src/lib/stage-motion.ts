/**
 * The stage's motion in the DOM: the slot flight, the handoff, the sort
 * (planned by {@link sortTimeline}) and the 6174 arrival.
 *
 * @remarks Every function checks {@link reducedMotion} first. Reduced
 * motion keeps the order of the rows, with opacity only.
 * @packageDocumentation
 */
import { EASE_IN_OUT, EASE_OUT, reducedMotion, spring } from '@/lib/motion'
import { RESULT_MS, type SortLine, sortTimeline } from '@/lib/sort-timeline'

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
/** One 6174 tile hops over this time. */
const ARRIVE_MS = 450
/** The 6174 tiles start their hops this far apart. */
const ARRIVE_STAGGER_MS = 40
/** The badge comes in this long after the hop starts. */
const BADGE_DELAY_MS = 250
/** A step shown at rest lands its 6174 hop this long after it paints. */
export const AT_REST_LANDED_MS = 300
/** The hand-drawn circle starts this long after the difference lands, with the badge. */
export const CIRCLE_DELAY_MS = 250

/** Reduced motion: when each row of a step fades in, in reading order, in ms from the step's start. */
const REDUCED = {
  descAt: ROW_GAP_MS,
  ascAt: 2 * ROW_GAP_MS,
  resultAt: 3 * ROW_GAP_MS,
  end: 3 * ROW_GAP_MS + RESULT_MS,
}

/**
 * How long step `index` with these input digits moves when autoplay
 * arrives at it: step 1 starts a run (its digits fly in from the slots;
 * a replay fades them in, sooner, so the wait is never short), and every
 * later step arrives by the handoff. Autoplay waits this long.
 */
export function stepMotionMs(digits: number[], index: number): number {
  if (reducedMotion()) return REDUCED.end
  return sortTimeline(digits, index === 0, index > 0 ? HANDOFF_MS : SLOTS_IN_MS).end
}

/**
 * A spring for the copies as they drop into their line: stiffness 456,
 * damping 27.3, so it overshoots by 7% and settles in about 400 ms.
 */
const DROP_SPRING = spring(456, 27.3).easing
/** The fill is the page text color at this opacity: it raises the digit contrast on the tile. */
const FILL_OPACITY = 0.3

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

/** The latest fill of each tile, so only it clears the tile's z-index when it ends. */
const currentFill = new WeakMap<HTMLElement, HTMLElement>()

/**
 * A fill inside the tile rises to d / 9 of its height, stays while the
 * tiles slide, then drains. The tile is isolated (NumberTiles), so the
 * fill paints over its background and under its digit. A z-index by digit
 * puts the bigger digit in front as paths cross. The fill removes itself
 * when it ends or is cancelled.
 */
function fillTile(tile: HTMLElement, at: number, drainAt: number, ms: number) {
  // Step 1: the bigger digit passes in front. The tile's own classes make it the fill's stacking context.
  const d = Number(tile.textContent)
  tile.style.zIndex = String(d)

  // Step 2: the fill, behind the digit, at scaleY(0).
  const fill = document.createElement('span')
  fill.style.cssText = `position:absolute;inset:0;z-index:-1;pointer-events:none;background:var(--foreground);opacity:${FILL_OPACITY};transform-origin:bottom;transform:scaleY(0)`
  tile.append(fill)
  currentFill.set(tile, fill)

  // Step 3: rise to d / 9, hold while the tiles slide, drain. Then remove the fill. A newer fill on the
  // same tile owns its z-index, so a cancelled older one leaves it alone.
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
      if (currentFill.get(tile) === fill) tile.style.zIndex = ''
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
function tilesOf(row: HTMLElement): HTMLElement[] {
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
function flipFrom(el: HTMLElement, first: DOMRect, duration: number): Animation | null {
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
  // Step 1: the direction of the move. The tile at the front leaves first, so no tile passes one that has landed.
  const right = slots[0] && tiles[0] ? tiles[0].getBoundingClientRect().left > slots[0].left : true
  // Step 2: each tile starts on its slot (FLIP: its first rect, inverted) and settles into place.
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
    fadeIn(rows.input, 0)
    fadeIn(rows.desc, REDUCED.descAt)
    fadeIn(rows.asc, REDUCED.ascAt)
    fadeIn(rows.resultBox, REDUCED.resultAt, RESULT_MS)
    return REDUCED.end
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
  // Step 1: reduced motion shows the badge only.
  if (reducedMotion()) {
    fadeIn(rows.badge, delay + BADGE_DELAY_MS)
    return
  }

  // Step 2: the 6174 tiles hop one after another, from their bottom edge.
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
  // Step 3: the badge comes in as the hops land.
  rows.badge.animate([{ opacity: 0, transform: 'scale(0.95)' }, { opacity: 1, transform: 'none' }], {
    duration: FADE_MS,
    delay: delay + BADGE_DELAY_MS,
    easing: EASE_OUT,
    fill: 'backwards',
  })
}
