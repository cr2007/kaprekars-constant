import { expect, test } from 'bun:test'
import { type Pair, REST_PAIR, ROLL_FACES, rollPair } from './dice-roll'

/** mulberry32: a small seeded PRNG, so the test gives the same rolls on every run. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Chi-square 0.999 quantiles (scipy.stats.chi2.ppf(0.999, df)), keyed by degrees of freedom. */
const CRITICAL_P001: Record<number, number> = { 23: 49.728, 34: 65.247 }

test('10,000 chained rolls are fair over every pair but the rest pair (chi-square, p = 0.001)', () => {
  const random = seeded(6174)
  const counts = new Map<string, number>()
  let last: Pair = REST_PAIR
  for (let i = 0; i < 10_000; i++) {
    const pair = rollPair(last, random)
    // Step 1: each roll differs from the last pair and from the rest pair.
    expect(pair).not.toEqual(last)
    expect(pair).not.toEqual(REST_PAIR)
    expect(ROLL_FACES).toContain(pair[0])
    expect(ROLL_FACES).toContain(pair[1])
    counts.set(pair.join(), (counts.get(pair.join()) ?? 0) + 1)
    last = pair
  }
  // Step 2: the chain never repeats a pair, so its long-run share of each allowed pair is equal.
  const categories = ROLL_FACES.length ** 2 - 1
  expect(counts.size).toBe(categories)
  const expected = 10_000 / categories
  const chi = [...counts.values()].reduce((sum, n) => sum + (n - expected) ** 2 / expected, 0)
  expect(chi).toBeLessThan(CRITICAL_P001[categories - 1])
})

test('the first roll from rest can be any pair but the rest pair', () => {
  const random = seeded(1)
  const seen = new Set<string>()
  for (let i = 0; i < 2_000; i++) seen.add(rollPair(REST_PAIR, random).join())
  expect(seen.size).toBe(ROLL_FACES.length ** 2 - 1)
  expect(seen.has(REST_PAIR.join())).toBe(false)
})

test('the lowest and highest random values stay inside the allowed pairs', () => {
  expect(rollPair(REST_PAIR, () => 0)).toEqual([1, 1])
  expect(rollPair(REST_PAIR, () => 0.999_999)).toEqual([6, 6])
  expect(rollPair([1, 1], () => 0)).toEqual([1, 2])
})
