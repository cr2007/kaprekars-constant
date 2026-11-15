import { expect, test } from 'bun:test'
import { ARRIVAL_MS, stepTimeline } from './stage-motion'

test('the rows of a step appear in reading order', () => {
  const plan = stepTimeline()
  expect(plan.descAt).toBeGreaterThan(0)
  expect(plan.ascAt).toBeGreaterThan(plan.descAt)
  expect(plan.resultAt).toBeGreaterThan(plan.ascAt)
  expect(plan.end).toBeGreaterThan(plan.resultAt)
})

test('the 6174 arrival ends when the 4th tile lands: 450 ms plus 3 gaps of 40 ms', () => {
  expect(ARRIVAL_MS).toBe(570)
})
