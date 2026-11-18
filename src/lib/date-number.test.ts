import { expect, test } from 'bun:test'
import { dateNumber } from './date-number'

test('a date reads as month then day', () => {
  expect(dateNumber(new Date(2026, 10, 15))).toBe(1115)
  expect(dateNumber(new Date(2026, 11, 3))).toBe(1203)
})

test('a date that is not a valid start number gives null', () => {
  // January to September start with 0; Nov 11 is a repdigit.
  expect(dateNumber(new Date(2026, 0, 20))).toBeNull()
  expect(dateNumber(new Date(2026, 10, 11))).toBeNull()
})
