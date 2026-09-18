import { cn } from 'cn'

interface NumberTilesProps {
  digits: number[]
  /** `lg` for the main step display, `sm` wherever the tiles need to shrink to fit. */
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * Renders digits as colored tiles, one per digit.
 *
 * The tiles are `aria-hidden`: a screen reader reading them one at a time
 * would hear "7, 7, 6, 6" instead of "7766". A hidden text node next to
 * them carries the real number instead.
 */
export function NumberTiles({ digits, size = 'lg', className }: NumberTilesProps) {
  return (
    <span className="inline-flex">
      <span aria-hidden="true" className={cn('flex gap-1.5 sm:gap-2', className)}>
        {digits.map((digit, index) => (
          <span
            key={index}
            className={cn(
              'flex items-center justify-center rounded-lg bg-primary font-chalk font-bold text-primary-foreground shadow-sm',
              size === 'lg'
                ? 'size-11 text-xl @5xl:size-14 @5xl:text-2xl'
                : 'size-8 text-sm sm:size-9 sm:text-base'
            )}
          >
            {digit}
          </span>
        ))}
      </span>
      <span className="sr-only">{digits.join('')}</span>
    </span>
  )
}

interface InlineNumberProps {
  digits: number[]
  className?: string
}

/** Renders digits as plain text, for the compact equation view. */
export function InlineNumber({ digits, className }: InlineNumberProps) {
  return <span className={cn('font-chalk tabular-nums', className)}>{digits.join('')}</span>
}
