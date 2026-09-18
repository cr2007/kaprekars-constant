import { useEffect, useState } from 'react'

type BookSide = 'left' | 'right'

/** Reads which side held the calculation last time, defaulting to the left page. */
function getInitialSide(): BookSide {
  return window.localStorage.getItem('book-side') === 'right' ? 'right' : 'left'
}

/**
 * Tracks which page of the foldable "book" layout (see `index.css`) holds
 * the calculation, and persists the choice to `localStorage`.
 *
 * This only affects layout on devices that report two viewport segments;
 * everywhere else it's inert state with no visible effect.
 */
export function useBookSide() {
  const [side, setSide] = useState<BookSide>(getInitialSide)

  useEffect(() => {
    window.localStorage.setItem('book-side', side)
  }, [side])

  function toggleSide() {
    setSide((current) => (current === 'left' ? 'right' : 'left'))
  }

  return { side, toggleSide }
}
