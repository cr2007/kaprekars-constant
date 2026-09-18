import { useEffect, useState } from 'react'

type BookSide = 'left' | 'right'

function getInitialSide(): BookSide {
  return window.localStorage.getItem('book-side') === 'right' ? 'right' : 'left'
}

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
