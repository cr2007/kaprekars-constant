import { sanitizeDigitInput } from '@/lib/kaprekar'

/**
 * Reads `n` from a query string as the field would hold it: digits only, at most 4.
 *
 * @remarks `?n=12345` gives "1234" and `?n=abcd` gives "".
 * The caller validates the value, so a bad link shows the same note as typing it.
 * @returns The sanitized value, or null when there is no `n`.
 */
export function parseInputParam(search: string): string | null {
  const n = new URLSearchParams(search).get('n')
  return n === null ? null : sanitizeDigitInput(n)
}

/** Reads `?n=` from the page URL. */
export function readInputParam(): string | null {
  return parseInputParam(window.location.search)
}

/**
 * Writes `?n=` to the URL with no reload and no history entry.
 *
 * @param value - The number to write, or null to remove `?n=`.
 */
export function writeNumberParam(value: string | null) {
  const url = new URL(window.location.href)
  if (value === null) url.searchParams.delete('n')
  else url.searchParams.set('n', value)
  window.history.replaceState(null, '', url)
}

/** The page URL with `?n=` set, for the share link. */
export function shareUrl(value: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set('n', value)
  return url.toString()
}
