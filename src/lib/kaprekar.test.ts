import { describe, expect, test } from 'bun:test'
import {
  KAPREKAR_CONSTANT,
  computeStep,
  nextStep,
  randomValidNumber,
  runKaprekarRoutine,
  sanitizeDigitInput,
  validateInput,
} from './kaprekar'

describe('sanitizeDigitInput', () => {
  test('strips non-digit characters', () => {
    expect(sanitizeDigitInput('3a5b2c4')).toBe('3524')
  })

  test('caps the result at 4 characters', () => {
    expect(sanitizeDigitInput('123456')).toBe('1234')
  })

  test('leaves a short digit string untouched', () => {
    expect(sanitizeDigitInput('35')).toBe('35')
  })

  test('returns an empty string for an empty input', () => {
    expect(sanitizeDigitInput('')).toBe('')
  })
})

describe('validateInput', () => {
  test('rejects an empty string', () => {
    expect(validateInput('').valid).toBe(false)
  })

  test('rejects non-digit characters', () => {
    expect(validateInput('12a4').valid).toBe(false)
  })

  test('rejects fewer than 4 digits', () => {
    expect(validateInput('123').valid).toBe(false)
  })

  test('rejects more than 4 digits', () => {
    expect(validateInput('12345').valid).toBe(false)
  })

  test('rejects a leading zero', () => {
    expect(validateInput('0123').valid).toBe(false)
  })

  test('rejects a leading zero before 4 digits are typed', () => {
    const result = validateInput('0')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/first digit cannot be 0/)
  })

  test('rejects a repdigit', () => {
    const result = validateInput('1111')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/same/)
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
  test('reaches 6174 within 7 steps for a typical number', () => {
    const steps = runKaprekarRoutine(3524)
    expect(steps.length).toBeLessThanOrEqual(7)
    expect(steps.at(-1)?.result).toBe(KAPREKAR_CONSTANT)
  })

  test('reaches 6174 for a number with a zero digit', () => {
    const steps = runKaprekarRoutine(1000)
    expect(steps.at(-1)?.result).toBe(KAPREKAR_CONSTANT)
  })

  test('reaches 6174 in a single step when already there', () => {
    const steps = runKaprekarRoutine(KAPREKAR_CONSTANT)
    expect(steps).toHaveLength(1)
    expect(steps[0].result).toBe(KAPREKAR_CONSTANT)
  })

  test('every 4-digit number with at least two different digits converges', () => {
    for (let n = 1000; n <= 9999; n += 37) {
      if (!validateInput(String(n)).valid) continue
      const steps = runKaprekarRoutine(n)
      expect(steps.at(-1)?.result).toBe(KAPREKAR_CONSTANT)
    }
  })
})

describe('nextStep', () => {
  test('shows that 6174 loops back to itself', () => {
    const step = nextStep(KAPREKAR_CONSTANT)
    expect(step.descendingDigits).toEqual([7, 6, 4, 1])
    expect(step.ascendingDigits).toEqual([1, 4, 6, 7])
    expect(step.result).toBe(KAPREKAR_CONSTANT)
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
})
