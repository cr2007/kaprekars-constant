import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BookSideToggleProps {
  side: 'left' | 'right'
  toggleSide: () => void
}

/**
 * Icon button that swaps the two pages of the foldable book layout: the
 * stage on one, the input and reading on the other. Hidden by CSS (see
 * `#book-side-toggle` in `index.css`) until the browser reports two
 * side-by-side viewport segments, so it never shows on a single screen.
 */
export function BookSideToggle({ side, toggleSide }: BookSideToggleProps) {
  return (
    <Button
      id="book-side-toggle"
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleSide}
      aria-label={side === 'left' ? 'Move the stage to the left page' : 'Move the stage to the right page'}
      title="Swap book pages"
    >
      {side === 'left' ? <PanelRight className="size-5" /> : <PanelLeft className="size-5" />}
    </Button>
  )
}
