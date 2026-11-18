import { useEffect, useState } from 'react'

/** The page that holds the input. */
type BookSide = 'left' | 'right'

/** Reads which page held the input last time, defaulting to the left page. */
function getInitialSide(): BookSide {
  try {
    return window.localStorage.getItem('book-side') === 'right' ? 'right' : 'left'
  } catch {
    // Storage is blocked (privacy settings, sandboxed frame): use the default.
    return 'left'
  }
}

/**
 * Tracks which page of the foldable "book" layout holds the input, and saves the choice.
 *
 * @remarks
 * - The stage takes the other page. See the book rules in `index.css`.
 * - The choice goes to `localStorage`.
 * - It changes layout only on devices that report two viewport segments. Elsewhere it has no visible effect.
 */
export function useBookSide() {
  const [side, setSide] = useState<BookSide>(getInitialSide)

  useEffect(() => {
    try {
      window.localStorage.setItem('book-side', side)
    } catch {
      // Storage is blocked: the choice lasts for this page load only.
    }
  }, [side])

  /** Swaps the two pages. */
  function toggleSide() {
    setSide((current) => (current === 'left' ? 'right' : 'left'))
  }

  return { side, toggleSide }
}
