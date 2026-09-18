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
            'flex items-center justify-center rounded-lg font-heading font-bold text-white shadow-sm',
            size === 'lg'
              ? 'size-11 text-xl sm:size-14 sm:text-2xl'
              : 'size-8 text-sm sm:size-9 sm:text-base'
          )}
          style={{ backgroundColor: colorForDigit(digit) }}
        >
          {digit}
        </div>
      ))}
    </div>
  )
}
