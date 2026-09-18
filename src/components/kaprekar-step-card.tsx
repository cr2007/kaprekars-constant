import { InlineNumber, NumberTiles } from '@/components/number-tiles'
import { KAPREKAR_CONSTANT, type KaprekarStep } from '@/lib/kaprekar'
import { cn } from 'cn'

interface KaprekarStepCardProps {
  step: KaprekarStep
  index: number
  isLast: boolean
  animate: boolean
}

export function KaprekarStepCard({ step, index, isLast, animate }: KaprekarStepCardProps) {
  const reachedConstant = step.result === KAPREKAR_CONSTANT

  return (
    <div
      id={`step-${index}`}
      className={cn('relative flex gap-4', animate && 'animate-step-in')}
      style={animate ? { animationDelay: `${index * 70}ms` } : undefined}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
            reachedConstant
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
            animate && reachedConstant && 'animate-constant-pulse'
          )}
          style={animate && reachedConstant ? { animationDelay: `${index * 70 + 300}ms` } : undefined}
        >
          {index + 1}
        </div>
        {!isLast && <div aria-hidden className="mt-1 w-px flex-1 bg-border" />}
      </div>

      <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
        <div
          id={`step-${index}-equation-compact`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 font-heading text-lg font-bold sm:hidden"
        >
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <InlineNumber digits={step.descendingDigits} />
            <span className="text-primary">&minus;</span>
            <InlineNumber digits={step.ascendingDigits} />
            <span className="text-foreground">=</span>
            <InlineNumber
              digits={step.result.toString().padStart(4, '0').split('').map(Number)}
              className={reachedConstant ? 'text-primary' : undefined}
            />
          </span>
          {reachedConstant && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              Kaprekar's constant
            </span>
          )}
        </div>

        <div
          id={`step-${index}-equation`}
          className="hidden flex-wrap items-end gap-x-5 gap-y-4 sm:flex"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Biggest arrangement</span>
            <NumberTiles digits={step.descendingDigits} />
          </div>

          <span className="pb-2 font-heading text-2xl font-bold text-primary">&minus;</span>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Smallest arrangement</span>
            <NumberTiles digits={step.ascendingDigits} />
          </div>

          <span className="pb-2 font-heading text-2xl font-bold text-foreground">=</span>

          <div
            id={`step-${index}-result`}
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-xl',
              reachedConstant && '-m-2 bg-primary/10 p-2'
            )}
          >
            <NumberTiles digits={step.result.toString().padStart(4, '0').split('').map(Number)} />
            {reachedConstant && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Kaprekar's constant
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
