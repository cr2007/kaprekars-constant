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
 * @remarks
 * - The tiles are `aria-hidden`: a screen reader would hear "7, 7, 6, 6", not "7766".
 * - A screen-reader-only text node next to them carries the real number.
 */
export function NumberTiles({ digits, tone = 'solid', className }: NumberTilesProps) {
  return (
    <span className="inline-flex">
      <span aria-hidden="true" className={cn('flex gap-1.5 sm:gap-2', className)}>
        {digits.map((digit, index) => (
          // relative, isolate, overflow-hidden: the sort's fill sits inside the tile, under the digit.
          // The digit has its own span, so a new digit replaces only that text, never the fill beside it.
          <span
            key={index}
            className={cn(
              'relative isolate flex size-11 items-center justify-center overflow-hidden rounded-lg font-mono text-xl font-bold',
              TILE_TONE[tone]
            )}
          >
            <span>{digit}</span>
          </span>
        ))}
      </span>
      <span className="sr-only">{digits.join('')}</span>
    </span>
  )
}
