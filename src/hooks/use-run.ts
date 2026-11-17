import { useEffect, useState } from 'react'
import {
  type KaprekarStep,
  computeStep,
  randomValidNumber,
  runKaprekarRoutine,
  sanitizeDigitInput,
  stepsToConstant,
  validateInput,
} from '@/lib/kaprekar'
import { readInputParam, writeNumberParam } from '@/lib/url'

/** Everything the page needs to show one run of the routine. */
export interface Run {
  /** The digits in the input field (0 to 4 of them). */
  rawInput: string
  /** Why the input cannot run yet, for display. Null when there is nothing to report. */
  error: string | null
  /** Every step on screen, including the extra round after "Do one more round". */
  steps: KaprekarStep[]
  /** Steps it took to first reach 6174. Excludes the extra round. 0 before a run. */
  stepCount: number
  /** True after "Do one more round" added the loop step. */
  wentFurther: boolean
  /** Goes up by one on each new run. Use it as a React key or an effect trigger. */
  runId: number
  /** Sanitizes typed text and runs the routine once 4 valid digits are in. */
  setInput: (value: string) => void
  /** Puts a random valid number in the input and runs it. */
  random: () => void
  /** Runs `value` directly (for quick picks). Ignores invalid values. */
  runNumber: (value: number) => void
  /** Adds one more round after 6174, to show that it loops to itself. */
  goFurther: () => void
  /** Which step-count challenge to show. It lasts across runs, so a new run can meet it. */
  challenge: number
  /** Moves to the next challenge. */
  nextChallenge: () => void
}

/**
 * The run state: the input, its error, and the steps on screen.
 *
 * @remarks It starts from `?n=` and keeps `?n=` in sync with the run.
 */
export function useRun(): Run {
  // Step 1: a ?n= link fills the field as if it were typed. A valid number runs; another one shows why it cannot.
  const [start] = useState(readInputParam)
  const startsValid = start !== null && validateInput(start).valid
  const [rawInput, setRawInput] = useState(start ?? '')
  const [error, setError] = useState<string | null>(() =>
    start && !startsValid ? (validateInput(start).message ?? null) : null
  )
  const [steps, setSteps] = useState<KaprekarStep[]>(() => (startsValid ? runKaprekarRoutine(Number(start)) : []))
  const [wentFurther, setWentFurther] = useState(false)
  const [runId, setRunId] = useState(0)
  const [challenge, setChallenge] = useState(0)

  // Step 2: the address holds only a link that runs: the cleaned number (?n=12345 becomes ?n=1234), or no n.
  useEffect(() => {
    if (start !== null) writeNumberParam(startsValid ? start : null)
  }, [start, startsValid])

  /** Clears the result without touching the input or the error. */
  function clearRun() {
    setSteps([])
    setWentFurther(false)
    writeNumberParam(null)
  }

  /** Validates `value`, then runs it or shows why it cannot run. */
  function runFor(value: string) {
    // Step 1: stop and explain when the number is not usable.
    const validation = validateInput(value)
    if (!validation.valid) {
      setError(validation.message ?? 'Enter a 4-digit number.')
      clearRun()
      return
    }

    // Step 2: run the routine, reset the extra round, and give the run a new id.
    setError(null)
    setSteps(runKaprekarRoutine(Number(value)))
    setWentFurther(false)
    setRunId((id) => id + 1)
    writeNumberParam(value)
  }

  /** Keeps the field to its first 4 digits and runs them when there are 4. */
  function setInput(value: string) {
    const digitsOnly = sanitizeDigitInput(value)
    // The same 4 digits as the run on screen (a 5th key, or a paste of the same number) keep the run going.
    if (digitsOnly === rawInput && steps.length > 0) return
    setRawInput(digitsOnly)

    // Step 1: 4 digits in means there is a full number to run.
    if (digitsOnly.length === 4) {
      runFor(digitsOnly)
      return
    }

    // Step 2: fewer than 4 digits. An empty field reports nothing; a
    // partial one says why it is not usable yet.
    clearRun()
    setError(digitsOnly.length === 0 ? null : (validateInput(digitsOnly).message ?? null))
  }

  /** Puts `value` in the field and runs it, if it is a valid start number. */
  function runNumber(value: number) {
    const text = String(value)
    if (!validateInput(text).valid) return
    setRawInput(text)
    runFor(text)
  }

  /** Runs a random valid number. */
  function random() {
    runNumber(randomValidNumber())
  }

  /** Adds the loop round once: 6174 gives 6174 again. */
  function goFurther() {
    const last = steps.at(-1)
    if (!last || wentFurther) return
    setSteps([...steps, computeStep(last.result)])
    setWentFurther(true)
  }

  return {
    rawInput,
    error,
    steps,
    stepCount: stepsToConstant(steps),
    wentFurther,
    runId,
    setInput,
    random,
    runNumber,
    goFurther,
    challenge,
    nextChallenge: () => setChallenge((c) => c + 1),
  }
}
