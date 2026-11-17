import { expect, test } from 'bun:test'
import { KAPREKAR_CONSTANT, computeStep, runKaprekarRoutine } from '@/lib/kaprekar'
import { endSentence, stepSentence } from './use-playback'

test('a step reads as one sentence', () => {
  expect(stepSentence(runKaprekarRoutine(3524), 0)).toBe('Step 1 of 3: 5432 minus 2345 equals 3087.')
})

test('the end sentence leaves out the extra round', () => {
  const steps = runKaprekarRoutine(3524)
  expect(endSentence(steps)).toBe('Reached 6174 in 3 steps.')
  expect(endSentence([...steps, computeStep(KAPREKAR_CONSTANT)])).toBe('Reached 6174 in 3 steps.')
  expect(endSentence(runKaprekarRoutine(KAPREKAR_CONSTANT))).toBe('Reached 6174 in 1 step.')
})
