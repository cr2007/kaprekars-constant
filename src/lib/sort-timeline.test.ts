import { expect, test } from 'bun:test'
import { sortTimeline } from './sort-timeline'
import { SLOTS_IN_MS } from './stage-motion'

/**
 * Every step input with two or more different digits, leading zeros kept (later steps have them).
 *
 * @remarks A mutation run (`STRYKER=1`) checks every 23rd input: the instrumented code runs about
 * 200 times slower, and the full list would take an hour per mutant. Normal runs check all 9,990.
 */
const ALL = Array.from({ length: 10000 }, (_, n) => String(n).padStart(4, '0').split('').map(Number))
  .filter((d) => new Set(d).size > 1)
  .filter((_, i) => !process.env.STRYKER || i % 23 === 0)

test('the sort ends every line in sorted order, in place, at full size, with equal digits in input order', () => {
  for (const digits of ALL) {
    for (const teach of [true, false]) {
      const plan = sortTimeline(digits, teach, teach ? SLOTS_IN_MS : 300)
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

test('the sort plays in order: bigger digits move first, copies land first, and the bigger digit grows', () => {
  for (const digits of ALL) {
    for (const teach of [true, false]) {
      const plan = sortTimeline(digits, teach, teach ? SLOTS_IN_MS : 300)
      for (const line of [plan.desc, plan.asc]) {
        // Step 1: one track and one fill per place.
        if (line.tracks.length !== 4 || line.fillAt.length !== 4 || line.drainAt.length !== 4) throw new Error(`${digits}: shape`)
        if (line.fillMs < 100) throw new Error(`${digits}: fill time ${line.fillMs}`)
        const spelled = line.order.map((slot) => digits[slot])
        line.tracks.forEach((track, i) => {
          // Step 2: an earlier place starts no later; a different digit starts strictly later.
          if (i > 0) {
            const [a, b] = [line.tracks[i - 1][0].t, track[0].t]
            if (spelled[i] === spelled[i - 1] ? a !== b : a >= b) throw new Error(`${digits}: place ${i} starts at ${b} after ${a}`)
          }
          // Step 3: time runs forward, and a moving digit grows if big (7 to 9) or shrinks if small (0 to 6).
          if (track.some((p, k) => k > 0 && p.t <= track[k - 1].t)) throw new Error(`${digits}: time runs back`)
          if (track.length > 1) {
            const d = spelled[i]
            const grows = Math.max(...track.map((p) => p.s)) > 1
            const shrinks = Math.min(...track.map((p) => p.s)) < 1
            if (d >= 7 ? !grows : !shrinks) throw new Error(`${digits}: digit ${d} scales the wrong way`)
          }
        })
      }
      // Step 4: line 2 slides once both copies land; line 3 fills once line 2 rests; the step ends after the result.
      if (Math.min(...plan.desc.tracks.map((t) => t[0].t)) < plan.asc.copyAt + plan.copyMs) throw new Error(`${digits}: slides before the copies land`)
      if (plan.asc.fillAt[0] < plan.desc.end) throw new Error(`${digits}: line 3 starts before line 2 rests`)
      if (plan.end <= plan.resultAt) throw new Error(`${digits}: ends before the result`)
    }
  }
})

test('step 1 ends in under 3.5 s for every number (0.55 s of it the digits flying in), and a later step in under 2 s', () => {
  let teach = 0
  let quick = 0
  for (const digits of ALL) {
    teach = Math.max(teach, sortTimeline(digits, true, SLOTS_IN_MS).end)
    quick = Math.max(quick, sortTimeline(digits, false, 300).end)
  }
  expect(teach).toBeLessThan(3500)
  expect(quick).toBeLessThan(2000)
})
