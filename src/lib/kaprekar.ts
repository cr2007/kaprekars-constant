export const KAPREKAR_CONSTANT = 6174

export interface KaprekarStep {
  input: number
  digits: number[]
  descendingDigits: number[]
  ascendingDigits: number[]
  descendingNumber: number
  ascendingNumber: number
  result: number
}

export interface ValidationResult {
  valid: boolean
  message?: string
}

function digitsOf(value: number): number[] {
  return value.toString().padStart(4, '0').split('').map(Number)
}

function numberFromDigits(digits: number[]): number {
  return Number(digits.join(''))
}

export function validateInput(raw: string): ValidationResult {
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
  if (raw[0] === '0') {
    return { valid: false, message: 'The first digit cannot be 0.' }
  }
  if (new Set(raw).size === 1) {
    return {
      valid: false,
      message: 'All 4 digits are the same. This number cannot reach 6174. Try a number with at least two different digits.',
    }
  }
  return { valid: true }
}

export function computeStep(input: number): KaprekarStep {
  const digits = digitsOf(input)
  const descendingDigits = [...digits].sort((a, b) => b - a)
  const ascendingDigits = [...digits].sort((a, b) => a - b)
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
  }
}

const MAX_ITERATIONS = 8

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

export function nextStep(afterResult: number): KaprekarStep {
  return computeStep(afterResult)
}

export function randomValidNumber(): number {
  let candidate: number
  do {
    candidate = Math.floor(1000 + Math.random() * 9000)
  } while (validateInput(String(candidate)).valid === false)
  return candidate
}
