import { KAPREKAR_CONSTANT, computeStep, validateInput } from '@/lib/kaprekar'

/** Step counts over every valid 4-digit input. Built once, on first use. */
interface Distribution {
  /** `byCount[k]` lists every valid input that first reaches 6174 in `k` steps (1 to 7). */
  byCount: number[][]
  /** How many valid inputs exist (8,991). */
  total: number
}

let cache: Distribution | null = null

/**
 * Groups the valid 4-digit numbers by step count, once, and caches the result.
 *
 * @remarks A number takes one step more than its difference, so each number runs one step only.
 * A full run per number made a 200 ms long task on a throttled phone (Lighthouse mobile).
 */
export function distribution(): Distribution {
  if (cache) return cache
  // Step 1: steps to 6174 from each number, filled in as the loop reaches it. 0 means not known yet.
  const stepsFrom = new Int8Array(10000)
  /** Steps to 6174 from `n`, memoized in `stepsFrom`; a result reuses the count of the number it leads to. */
  const count = (n: number): number => {
    if (!stepsFrom[n]) {
      const result = computeStep(n).result
      stepsFrom[n] = result === KAPREKAR_CONSTANT ? 1 : 1 + count(result)
    }
    return stepsFrom[n]
  }

  // Step 2: group the valid inputs by their count.
  const byCount: number[][] = Array.from({ length: 8 }, () => [])
  let total = 0
  for (let n = 1000; n <= 9999; n++) {
    if (!validateInput(String(n)).valid) continue
    byCount[count(n)].push(n)
    total++
  }
  cache = { byCount, total }
  return cache
}

/** How many valid inputs take exactly `steps` steps. */
export function countWithSteps(steps: number): number {
  return distribution().byCount[steps]?.length ?? 0
}

/** A random valid input that takes exactly `steps` steps. */
export function randomWithSteps(steps: number): number {
  const pool = distribution().byCount[steps] ?? []
  return pool[Math.floor(Math.random() * pool.length)]
}

/** How many valid inputs take exactly `steps` steps, out of all of them, and that share in percent. */
export function shareWithSteps(steps: number): { count: number; total: number; percent: number } {
  const count = countWithSteps(steps)
  const { total } = distribution()
  return { count, total, percent: (count / total) * 100 }
}
