import { expect, test } from 'bun:test'
import { bezier, spring } from './motion'

/** The sample values of a `linear()` easing. */
const samples = (easing: string) => easing.slice('linear('.length, -1).split(', ').map(Number)

test('the trail spring starts at 0, ends exactly at 1, and settles in about half a second', () => {
  const { easing, ms } = spring(170, 22)
  const values = samples(easing)
  expect(values[0]).toBe(0)
  expect(values[1]).toBeLessThan(0.1)
  expect(values.at(-1)).toBe(1)
  expect(ms).toBeGreaterThan(450)
  expect(ms).toBeLessThan(600)
})

test('the trail spring overshoots by under 1%, and is half way in the first quarter of its time', () => {
  const values = samples(spring(170, 22).easing)
  expect(Math.max(...values)).toBeLessThan(1.01)
  expect(values.findIndex((v) => v >= 0.5) / (values.length - 1)).toBeLessThan(0.25)
})

test('bezier matches CSS cubic-bezier values from an independent solver', () => {
  // References: Newton's method on the same curves, not this bisection.
  const ease = bezier(0.25, 0.1, 0.25, 1)
  expect(ease(0.5)).toBeCloseTo(0.802403, 4)
  expect(ease(0.25)).toBeCloseTo(0.408511, 4)
  expect(bezier(0.2, 0, 0, 1)(0.3)).toBeCloseTo(0.688067, 4)
  // A straight curve is the identity, and a symmetric one crosses at the middle.
  const linear = bezier(0, 0, 1, 1)
  for (const x of [0.1, 0.33, 0.7]) expect(linear(x)).toBeCloseTo(x, 4)
  expect(bezier(0.42, 0, 0.58, 1)(0.5)).toBeCloseTo(0.5, 4)
})

test('bezier clamps progress outside 0 to 1', () => {
  const ease = bezier(0.25, 0.1, 0.25, 1)
  expect(ease(-0.2)).toBe(0)
  expect(ease(0)).toBe(0)
  expect(ease(1)).toBe(1)
  expect(ease(1.3)).toBe(1)
})
