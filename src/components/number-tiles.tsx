import { cn } from 'cn'

interface NumberTilesProps {
  digits: number[]
  size?: 'sm' | 'lg'
  className?: string
}

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

export function InlineNumber({ digits, className }: InlineNumberProps) {
  return <span className={cn('font-chalk tabular-nums', className)}>{digits.join('')}</span>
}
