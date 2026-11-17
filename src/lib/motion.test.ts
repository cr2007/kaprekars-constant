import { expect, test } from 'bun:test'
import { spring } from './motion'

/** The sample values of a `linear()` easing. */
const samples = (easing: string) => easing.slice('linear('.length, -1).split(', ').map(Number)

test('the trail spring starts at 0, ends exactly at 1, and settles in about half a second', () => {
  const { easing, ms } = spring(170, 22)
  const values = samples(easing)
  expect(values[0]).toBe(0)
  expect(values.at(-1)).toBe(1)
  expect(ms).toBeGreaterThan(450)
  expect(ms).toBeLessThan(600)
})

test('the trail spring overshoots by under 1%, and is half way in the first quarter of its time', () => {
  const values = samples(spring(170, 22).easing)
  expect(Math.max(...values)).toBeLessThan(1.01)
  expect(values.findIndex((v) => v >= 0.5) / (values.length - 1)).toBeLessThan(0.25)
})
