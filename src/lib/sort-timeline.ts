/**
 * The plan of one step's sort, as plain data, with no DOM.
 *
 * @remarks A copy of the input drops into line 2 and into line 3. Then each
 * line sorts in place: a fill inside each tile rises to its digit (a 9
 * fills the tile, a 0 stays empty), the tiles slide into order in their
 * own line, and the fills drain. Where paths cross, the bigger digit
 * passes in front. Step 1 plays at full time; later steps at 60%.
 * {@link playStep} in `stage-motion.ts` plays this plan.
 *
 * @packageDocumentation
 */
import { bezier } from '@/lib/motion'

/** The difference rises into place over this time. */
export const RESULT_MS = 200
/** The fill rises over this many ms at step 1. */
const FILL_MS = 200
/** The slide starts this many ms after the fill starts. */
const SLIDE_AT_MS = 290
/** The slide takes this many ms. */
const SLIDE_MS = 300
/** The drain starts this many ms after the slide ends. */
const DRAIN_AT_MS = 60
/** Places of equal rank start this far apart, biggest first in line 2. */
const RANK_MS = 30
/** Material 3 emphasized, for the slide in the line. */
const EMPHASIZED = bezier(0.2, 0, 0, 1)

/** A tile pose at time `t`: `x` in places (0 to 3), `s` the scale. */
interface TrackPoint {
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
  /** When each fill starts to rise. */
  fillAt: number[]
  /** When each fill starts to drain. */
  drainAt: number[]
  fillMs: number
  /** The line is at rest. */
  end: number
}

/** One step's plan: both lines, the copy drop time, and when the difference lands. */
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

/**
 * The poses of one line that sorts from input order.
 *
 * @param t0 - When the line starts to sort, in ms.
 * @param k - The time scale: 1 at step 1, 0.6 later.
 */
function sortLine(digits: number[], desc: boolean, copyAt: number, t0: number, k: number): SortLine {
  const order = stableOrder(digits, desc)
  const line: SortLine = { order, copyAt, tracks: [], fillAt: [], drainAt: [], fillMs: k * FILL_MS, end: t0 }
  order.forEach((slot, i) => {
    // Step 1: the digit in place i, and its rank. Equal digits share a rank, so they start together and never pass.
    const d = digits[slot]
    const r = order.findIndex((other) => digits[other] === d)
    const slideAt = t0 + k * (SLIDE_AT_MS + r * RANK_MS)

    // Step 2: the slide from its input slot to place i, sampled about every 16 ms. A tile already in place stays.
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

    // Step 3: the fill rises first and drains 60 ms after the slide; the line rests when the last fill is gone.
    line.fillAt.push(t0 + k * r * RANK_MS)
    line.drainAt.push(slideAt + k * (SLIDE_MS + DRAIN_AT_MS))
    line.end = Math.max(line.end, slideAt + k * (SLIDE_MS + DRAIN_AT_MS + FILL_MS))
  })
  return line
}

/**
 * The timeline of one step.
 *
 * @param teach - Step 1 of a run: full time. Later steps run at 60%.
 * @param inputMs - When the input row is in place: the copies drop then.
 * @returns Both lines, then the difference at `resultAt`; the step rests at `end`.
 */
export function sortTimeline(digits: number[], teach: boolean, inputMs: number): SortTimeline {
  const k = teach ? 1 : 0.6
  const copyMs = teach ? 260 : 180
  const pause = teach ? 80 : 30
  const ascCopy = inputMs + copyMs / 2
  const desc = sortLine(digits, true, inputMs, ascCopy + copyMs + pause, k)
  const asc = sortLine(digits, false, ascCopy, desc.end + pause, k)
  const resultAt = asc.end + pause
  return { copyMs, desc, asc, resultAt, end: resultAt + RESULT_MS }
}
