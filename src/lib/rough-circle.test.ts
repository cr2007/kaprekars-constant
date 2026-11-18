import { describe, expect, test } from 'bun:test'
import { roughCircle } from './rough-circle'

/**
 * rough-notation 0.5.1's circle for seed 24116 on a 40x40 target with
 * padding [8, 11]: the numbers of its two path `d` strings, rounded to
 * 2 places. Captured in Chromium from the library itself.
 */
const LIBRARY = [
  [
    7.6, -5.78, 13.52, -8.34, 23.55, -9.08, 30.15, -7.29, 36.75, -5.5, 43.7, -0.31, 47.2, 4.97, 50.7, 10.25, 52.3, 18.04,
    51.16, 24.38, 50.02, 30.71, 45.46, 38.85, 40.36, 42.99, 35.26, 47.14, 27.27, 49.23, 20.55, 49.25, 13.84, 49.27, 5.32,
    47.16, 0.1, 43.12, -5.13, 39.08, -9.63, 31.23, -10.81, 25.01, -11.99, 18.8, -11.96, 11.35, -6.98, 5.84, -2.01, 0.33,
    13.42, -5.74, 19.02, -8.05, 24.63, -10.36, 26.74, -8.52, 26.66, -8.04,
  ],
  [
    26.51, -6.68, 32.64, -5.92, 39.26, -3.74, 43.32, 0.83, 47.38, 5.4, 50.99, 14.63, 50.86, 20.74, 50.73, 26.86, 47.01,
    33.06, 42.52, 37.51, 38.03, 41.97, 30, 46.11, 23.89, 47.48, 17.78, 48.86, 11.39, 48.8, 5.85, 45.76, 0.32, 42.71, -6.53,
    35.16, -9.31, 29.22, -12.1, 23.29, -12.92, 15.73, -10.86, 10.16, -8.81, 4.6, -2.85, -1.48, 3.03, -4.16, 8.91, -6.85, 21,
    -5.41, 24.43, -5.96, 27.85, -6.51, 23.66, -7.29, 23.59, -7.45,
  ],
]

/** The numbers in a path `d` string. */
const numbers = (d: string) => d.match(/-?[\d.]+(e-?\d+)?/g)!.map(Number)

describe('roughCircle', () => {
  test('matches rough-notation 0.5.1 for the same seed and box', () => {
    // The library's target sits at (0, 0), so the padded box centers at (-11 + 62 / 2, -8 + 56 / 2).
    const paths = roughCircle(20, 20, 62, 56, 24116).map(numbers)
    expect(paths.map((path) => path.map((n) => Math.round(n * 100) / 100))).toEqual(LIBRARY)
  })
})
