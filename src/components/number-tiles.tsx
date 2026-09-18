import { colorForDigit } from '@/lib/digit-colors'
import { cn } from 'cn'

interface NumberTilesProps {
  digits: number[]
  size?: 'sm' | 'lg'
  className?: string
}

export function NumberTiles({ digits, size = 'lg', className }: NumberTilesProps) {
  return (
    <div className={cn('flex gap-1.5 sm:gap-2', className)}>
      {digits.map((digit, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center justify-center rounded-lg font-heading font-bold shadow-sm',
            size === 'lg'
              ? 'size-11 text-xl @5xl:size-14 @5xl:text-2xl'
              : 'size-8 text-sm sm:size-9 sm:text-base'
          )}
          style={{ backgroundColor: colorForDigit(digit), color: 'var(--tile-text)' }}
        >
          {digit}
        </div>
      ))}
    </div>
  )
}

interface InlineNumberProps {
  digits: number[]
  className?: string
}

export function InlineNumber({ digits, className }: InlineNumberProps) {
  return <span className={cn('tabular-nums', className)}>{digits.join('')}</span>
}
