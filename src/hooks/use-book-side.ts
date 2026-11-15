import { useEffect, useState } from 'react'

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
 * Tracks which page of the foldable "book" layout (see `index.css`) holds
 * the input; the stage takes the other page. It persists the choice to
 * `localStorage`.
 *
 * This only affects layout on devices that report two viewport segments;
 * everywhere else it's inert state with no visible effect.
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
