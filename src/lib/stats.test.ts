import { describe, expect, test } from 'bun:test'
import { runKaprekarRoutine } from './kaprekar'
import { countWithSteps, distribution, randomWithSteps, shareWithSteps } from './stats'

describe('distribution', () => {
  test('counts 8,991 valid inputs', () => {
    expect(distribution().total).toBe(8991)
  })

  test('puts every valid input in exactly one group of 1 to 7 steps', () => {
    const { byCount, total } = distribution()
    expect(byCount[0]).toEqual([])
    expect(byCount.reduce((sum, group) => sum + group.length, 0)).toBe(total)
  })

  test('puts 3524 with the 3-step numbers', () => {
    expect(distribution().byCount[3]).toContain(3524)
  })
})

describe('countWithSteps', () => {
  test('is 0 for a count no input takes', () => {
    expect(countWithSteps(0)).toBe(0)
    expect(countWithSteps(8)).toBe(0)
  })
})

describe('randomWithSteps', () => {
  test('returns a number that takes the asked step count', () => {
    for (const steps of [1, 4, 7]) {
      expect(runKaprekarRoutine(randomWithSteps(steps))).toHaveLength(steps)
    }
  })
})

describe('shareWithSteps', () => {
  test('gives the count, the total and the percent for a step count', () => {
    const share = shareWithSteps(3)
    expect(share).toMatchObject({ count: 2124, total: 8991 })
    expect(share.percent.toFixed(1)).toBe('23.6')
  })
})
