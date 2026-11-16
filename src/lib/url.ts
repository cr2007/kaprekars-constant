import { sanitizeDigitInput } from '@/lib/kaprekar'

/**
 * Reads `n` from a query string as the field would hold it if it were
 * typed: digits only, at most 4. So `?n=12345` gives "1234" and `?n=abcd`
 * gives "". Null when there is no `n`. The caller validates it, so an
 * unusable link shows the same note as typing it would.
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
 * Writes `?n=` to the URL without a reload or a history entry, so the
 * address bar always holds a link to the run on screen. `null` removes it.
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
