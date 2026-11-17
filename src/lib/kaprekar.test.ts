import { describe, expect, test } from 'bun:test'
import {
  type InputProblem,
  KAPREKAR_CONSTANT,
  computeStep,
  randomValidNumber,
  runKaprekarRoutine,
  sanitizeDigitInput,
  stepsToConstant,
  validateInput,
} from './kaprekar'

describe('sanitizeDigitInput', () => {
  test('strips non-digit characters', () => {
    expect(sanitizeDigitInput('3a5b2c4')).toBe('3524')
  })

  test('caps the result at 4 characters', () => {
    expect(sanitizeDigitInput('123456')).toBe('1234')
  })

  test('keeps all 4 digits of a pasted number with a separator', () => {
    // The field has no maxLength: it would cut "1,234" to "1,23" before this keeps the 4 digits.
    expect(sanitizeDigitInput('1,234')).toBe('1234')
    expect(sanitizeDigitInput(' 3 524 ')).toBe('3524')
  })

  test('leaves a short digit string untouched', () => {
    expect(sanitizeDigitInput('35')).toBe('35')
  })

  test('returns an empty string for an empty input', () => {
    expect(sanitizeDigitInput('')).toBe('')
  })

  test('reads Arabic-Indic, Persian and full-width digits from phone keyboards', () => {
    expect(sanitizeDigitInput('\u0669\u0668\u0667\u0660')).toBe('9870')
    expect(sanitizeDigitInput('\u06F1\u06F2\u06F3\u06F4')).toBe('1234')
    expect(sanitizeDigitInput('\uFF15\uFF16\uFF17\uFF19')).toBe('5679')
  })
})

describe('validateInput', () => {
  test.each<[string, string, InputProblem]>([
    ['an empty string', '', 'empty'],
    ['a non-digit', '12a4', 'not-digits'],
    ['fewer than 4 digits', '123', 'short'],
    ['more than 4 digits', '12345', 'long'],
    ['a leading zero', '0123', 'leading-zero'],
    ['a repdigit', '1111', 'same-digits'],
  ])('rejects %s, and says why', (_case, raw, reason) => {
    expect(validateInput(raw)).toEqual({ valid: false, reason })
  })

  test('accepts a valid 4-digit number', () => {
    expect(validateInput('3524')).toEqual({ valid: true })
  })
})

describe('computeStep', () => {
  test('sorts digits both ways and subtracts', () => {
    const step = computeStep(3524)
    expect(step.descendingDigits).toEqual([5, 4, 3, 2])
    expect(step.ascendingDigits).toEqual([2, 3, 4, 5])
    expect(step.descendingNumber).toBe(5432)
    expect(step.ascendingNumber).toBe(2345)
    expect(step.result).toBe(3087)
    expect(step.resultDigits).toEqual([3, 0, 8, 7])
  })

  test('pads a result with leading zeros to 4 digits', () => {
    // 1000 -> descending 1000, ascending 0001 -> 999.
    const step = computeStep(1000)
    expect(step.result).toBe(999)
    expect(step.resultDigits).toEqual([0, 9, 9, 9])
  })

  test('6174 maps to itself, the fixed point', () => {
    const step = computeStep(KAPREKAR_CONSTANT)
    expect(step.result).toBe(KAPREKAR_CONSTANT)
  })
})

describe('runKaprekarRoutine', () => {
  test('reaches 6174 in a single step when already there', () => {
    const steps = runKaprekarRoutine(KAPREKAR_CONSTANT)
    expect(steps).toHaveLength(1)
    expect(steps[0].result).toBe(KAPREKAR_CONSTANT)
  })

  test('every valid 4-digit input reaches 6174 in at most 7 steps', () => {
    // Step 1: run the routine on all 8,991 valid inputs and count steps.
    const stepCounts: Record<number, number> = {}
    for (let n = 1000; n <= 9999; n++) {
      if (!validateInput(String(n)).valid) continue
      const steps = runKaprekarRoutine(n)
      expect(steps.at(-1)?.result).toBe(KAPREKAR_CONSTANT)
      stepCounts[steps.length] = (stepCounts[steps.length] ?? 0) + 1
    }

    // Step 2: compare with the known distribution (6174 itself is 1 step).
    expect(stepCounts).toEqual({
      1: 357,
      2: 519,
      3: 2124,
      4: 1124,
      5: 1379,
      6: 1508,
      7: 1980,
    })
  })
})

describe('randomValidNumber', () => {
  test('always returns a number validateInput accepts', () => {
    for (let i = 0; i < 50; i++) {
      const candidate = randomValidNumber()
      expect(candidate).toBeGreaterThanOrEqual(1000)
      expect(candidate).toBeLessThanOrEqual(9999)
      expect(validateInput(String(candidate)).valid).toBe(true)
    }
  })

  test('spreads its picks: Random must not keep giving the same number', () => {
    const picks = new Set(Array.from({ length: 50 }, randomValidNumber))
    expect(picks.size).toBeGreaterThan(40)
  })
})

describe('stepsToConstant', () => {
  test('counts the steps up to the first 6174', () => {
    expect(stepsToConstant(runKaprekarRoutine(3524))).toBe(3)
  })

  test('leaves out the extra round after 6174', () => {
    const steps = runKaprekarRoutine(3524)
    expect(stepsToConstant([...steps, computeStep(KAPREKAR_CONSTANT)])).toBe(3)
  })

  test('is 0 for no steps', () => {
    expect(stepsToConstant([])).toBe(0)
  })
})
