import { TILE_TONE } from '@/lib/tile-tone'
import { cn } from 'cn'

interface NumberTilesProps {
  digits: number[]
  /** `solid` (default) for the subtraction, `outline` for the start number. */
  tone?: keyof typeof TILE_TONE
  /** Classes for the tile row. `*:` variants reach each tile, e.g. `md:*:size-14`. */
  className?: string
}

/**
 * Renders digits as colored tiles, one per digit.
 *
 * The tiles are `aria-hidden`: a screen reader reading them one at a time
 * would hear "7, 7, 6, 6" instead of "7766". A hidden text node next to
 * them carries the real number instead.
 */
export function NumberTiles({ digits, tone = 'solid', className }: NumberTilesProps) {
  return (
    <span className="inline-flex">
      <span aria-hidden="true" className={cn('flex gap-1.5 sm:gap-2', className)}>
        {digits.map((digit, index) => (
          <span
            key={index}
            className={cn('flex size-11 items-center justify-center rounded-lg font-mono text-xl font-bold', TILE_TONE[tone])}
          >
            {digit}
          </span>
        ))}
      </span>
      <span className="sr-only">{digits.join('')}</span>
    </span>
  )
}
