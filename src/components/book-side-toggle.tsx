import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BookSideToggleProps {
  side: 'left' | 'right'
  toggleSide: () => void
}

/**
 * Icon button that swaps which page of the foldable "book" layout holds
 * the calculation. Hidden by CSS (see `#book-side-toggle` in `index.css`)
 * until the browser actually reports two viewport segments, so it never
 * appears on an ordinary single-screen device.
 */
export function BookSideToggle({ side, toggleSide }: BookSideToggleProps) {
  return (
    <Button
      id="book-side-toggle"
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleSide}
      aria-label={
        side === 'left'
          ? 'Move the calculation to the left page'
          : 'Move the calculation to the right page'
      }
      title="Swap book pages"
    >
      {side === 'left' ? <PanelRight className="size-4" /> : <PanelLeft className="size-4" />}
    </Button>
  )
}
