import { validateInput } from '@/lib/kaprekar'

/** A date's month and day as 4 digits (Nov 15 is 1115), if that is a valid start number. */
export function dateNumber(date: Date): number | null {
  const text = `${date.getMonth() + 1}`.padStart(2, '0') + `${date.getDate()}`.padStart(2, '0')
  return validateInput(text).valid ? Number(text) : null
}
