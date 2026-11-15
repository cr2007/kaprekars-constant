import { validateInput } from '@/lib/kaprekar'

/** Reads `n` from a query string. Returns it only when it is a valid start number. */
export function parseNumberParam(search: string): string | null {
  const n = new URLSearchParams(search).get('n')
  return n !== null && validateInput(n).valid ? n : null
}

/** Reads `?n=` from the page URL. */
export function readNumberParam(): string | null {
  return parseNumberParam(window.location.search)
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
