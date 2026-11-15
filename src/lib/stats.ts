import { runKaprekarRoutine, validateInput } from '@/lib/kaprekar'

/** Step counts over every valid 4-digit input. Built once, on first use. */
export interface Distribution {
  /** `byCount[k]` lists every valid input that first reaches 6174 in `k` steps (1 to 7). */
  byCount: number[][]
  /** How many valid inputs exist (8,991). */
  total: number
}

let cache: Distribution | null = null

/**
 * Runs the routine on all 9,000 four-digit numbers once and groups the
 * valid ones by step count. It costs a few milliseconds; the result is cached.
 */
export function distribution(): Distribution {
  if (cache) return cache
  const byCount: number[][] = Array.from({ length: 8 }, () => [])
  let total = 0
  for (let n = 1000; n <= 9999; n++) {
    if (!validateInput(String(n)).valid) continue
    byCount[runKaprekarRoutine(n).length].push(n)
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
