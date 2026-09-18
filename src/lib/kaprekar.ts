/** The number every Kaprekar routine on 4 digits settles on. */
export const KAPREKAR_CONSTANT = 6174

/** One iteration of the routine: an input number and its computed result. */
export interface KaprekarStep {
  /** The number this step started from. */
  input: number
  /** `input`'s digits, in their original order. */
  digits: number[]
  /** `digits` sorted largest first. */
  descendingDigits: number[]
  /** `digits` sorted smallest first. */
  ascendingDigits: number[]
  /** `descendingDigits` read back as a number. */
  descendingNumber: number
  /** `ascendingDigits` read back as a number. */
  ascendingNumber: number
  /** `descendingNumber - ascendingNumber`. The next step's input. */
  result: number
  /** `result`'s digits, zero-padded to 4. Saves callers re-deriving this for display. */
  resultDigits: number[]
}

/** The outcome of checking whether a string is a usable 4-digit number. */
export interface ValidationResult {
  valid: boolean
  /** Present when `valid` is false; explains why, for display to the user. */
  message?: string
}

/**
 * Splits a number into its individual digits, left-padded with zeros to 4
 * places. Used for intermediate results that may be smaller than 1000
 * (e.g. 999 becomes [0, 9, 9, 9]) as well as for the starting input.
 */
function digitsOf(value: number): number[] {
  return value.toString().padStart(4, '0').split('').map(Number)
}

/** Reassembles a digit array back into the number it spells out. */
function numberFromDigits(digits: number[]): number {
  return Number(digits.join(''))
}

/**
 * Checks whether a raw string is a valid starting point for the routine:
 * exactly 4 digits, no leading zero, and not all digits identical (which
 * would make the biggest and smallest arrangements equal, so the routine
 * would only ever produce 0).
 */
export function validateInput(raw: string): ValidationResult {
  // Step 1: reject anything that isn't exactly 4 digits.
  if (raw.length === 0) {
    return { valid: false, message: 'Enter a 4-digit number.' }
  }
  if (!/^\d+$/.test(raw)) {
    return { valid: false, message: 'Use digits only.' }
  }
  if (raw.length < 4) {
    return { valid: false, message: 'Enter 4 digits.' }
  }
  if (raw.length > 4) {
    return { valid: false, message: 'Enter only 4 digits.' }
  }

  // Step 2: reject a leading zero. "0123" is not a 4-digit number.
  if (raw[0] === '0') {
    return { valid: false, message: 'The first digit cannot be 0.' }
  }

  // Step 3: reject repdigits (1111, 2222, ...). Every arrangement of a
  // repdigit is identical, so descending minus ascending is always 0.
  if (new Set(raw).size === 1) {
    return {
      valid: false,
      message:
        'All 4 digits are the same. This number cannot reach 6174. Try a number with at least two different digits.',
    }
  }

  return { valid: true }
}

/**
 * Runs one round of the routine on a number: sort its digits both ways,
 * subtract, and package up everything needed to display the step.
 */
export function computeStep(input: number): KaprekarStep {
  // Step 1: get the digits, then sort them both ways.
  const digits = digitsOf(input)
  const descendingDigits = [...digits].sort((a, b) => b - a)
  const ascendingDigits = [...digits].sort((a, b) => a - b)

  // Step 2: read the two arrangements back as numbers and subtract.
  const descendingNumber = numberFromDigits(descendingDigits)
  const ascendingNumber = numberFromDigits(ascendingDigits)
  const result = descendingNumber - ascendingNumber

  return {
    input,
    digits,
    descendingDigits,
    ascendingDigits,
    descendingNumber,
    ascendingNumber,
    result,
    resultDigits: digitsOf(result),
  }
}

/**
 * The routine always reaches 6174 within 7 steps for any valid input, per
 * `validateInput`. 8 is a safety cap, not a value it should ever need.
 */
const MAX_ITERATIONS = 8

/**
 * Repeats {@link computeStep} starting from `start`, stopping as soon as a
 * step's result is {@link KAPREKAR_CONSTANT}, or after {@link MAX_ITERATIONS}
 * rounds if that never happens.
 */
export function runKaprekarRoutine(start: number): KaprekarStep[] {
  const steps: KaprekarStep[] = []
  let current = start

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const step = computeStep(current)
    steps.push(step)
    if (step.result === KAPREKAR_CONSTANT) break
    current = step.result
  }

  return steps
}

/**
 * Computes one more step after the routine has already reached
 * {@link KAPREKAR_CONSTANT}, to show that it loops back to itself
 * (7641 - 1467 = 6174).
 */
export function nextStep(afterResult: number): KaprekarStep {
  return computeStep(afterResult)
}

/** Picks a random 4-digit number that {@link validateInput} accepts. */
export function randomValidNumber(): number {
  let candidate: number
  do {
    candidate = Math.floor(1000 + Math.random() * 9000)
  } while (validateInput(String(candidate)).valid === false)
  return candidate
}
