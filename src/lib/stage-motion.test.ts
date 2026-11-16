import { expect, test } from 'bun:test'
import { ARRIVAL_MS, sortTimeline, stepTimeline } from './stage-motion'

test('the rows of a step appear in reading order', () => {
  const plan = stepTimeline(false)
  expect(plan.descAt).toBeGreaterThan(0)
  expect(plan.ascAt).toBeGreaterThan(plan.descAt)
  expect(plan.resultAt).toBeGreaterThan(plan.ascAt)
  expect(plan.end).toBeGreaterThan(plan.resultAt)
})

test('the 6174 arrival ends when the 4th tile lands: 450 ms plus 3 gaps of 40 ms', () => {
  expect(ARRIVAL_MS).toBe(570)
})

test('with the handoff, line 2 waits for the last result to reach the input row', () => {
  const plain = stepTimeline(false)
  const handoff = stepTimeline(true)
  expect(handoff.descAt).toBe(300)
  expect(handoff.end - handoff.descAt).toBe(plain.end - plain.descAt)
})

/** Every step input with two or more different digits, leading zeros kept (later steps have them). */
const ALL = Array.from({ length: 10000 }, (_, n) => String(n).padStart(4, '0').split('').map(Number)).filter(
  (d) => new Set(d).size > 1
)

test('the sort ends every line in sorted order, in place, at full size, with equal digits in input order', () => {
  for (const digits of ALL) {
    for (const teach of [true, false]) {
      const plan = sortTimeline(digits, teach, !teach)
      for (const [line, desc] of [[plan.desc, true], [plan.asc, false]] as const) {
        const spelled = line.order.map((slot) => digits[slot])
        const want = [...digits].sort((a, b) => (desc ? b - a : a - b))
        if (spelled.join() !== want.join()) throw new Error(`${digits}: spells ${spelled}`)
        for (let i = 1; i < 4; i++) {
          if (spelled[i] === spelled[i - 1] && line.order[i] < line.order[i - 1]) throw new Error(`${digits}: unstable`)
        }
        line.tracks.forEach((track, i) => {
          const end = track[track.length - 1]
          if (Math.abs(end.x - i) > 1e-9 || Math.abs(end.s - 1) > 1e-9) throw new Error(`${digits}: place ${i} ends off rest`)
          if (Math.abs(track[0].x - line.order[i]) > 1e-9) throw new Error(`${digits}: place ${i} starts off its input slot`)
        })
        if (line.drainAt.some((t, i) => t <= line.fillAt[i])) throw new Error(`${digits}: fill`)
      }
      if (!(plan.asc.tracks[0][0].t > plan.desc.end && plan.resultAt > plan.asc.end)) throw new Error(`${digits}: order`)
    }
  }
})

test('step 1 sorts in under 3 s for every number, and a later step in under 2 s', () => {
  let teach = 0
  let quick = 0
  for (const digits of ALL) {
    teach = Math.max(teach, sortTimeline(digits, true, false).end)
    quick = Math.max(quick, sortTimeline(digits, false, true).end)
  }
  expect(teach).toBeLessThan(3000)
  expect(quick).toBeLessThan(2000)
})
