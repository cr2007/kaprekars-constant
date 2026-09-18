import { NumberTiles } from '@/components/number-tiles'
import { KAPREKAR_CONSTANT, type KaprekarStep } from '@/lib/kaprekar'
import { cn } from 'cn'

interface KaprekarStepCardProps {
  step: KaprekarStep
  index: number
  animate: boolean
}

export function KaprekarStepCard({ step, index, animate }: KaprekarStepCardProps) {
  const reachedConstant = step.result === KAPREKAR_CONSTANT

  return (
    <div
      id={`step-${index}`}
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        reachedConstant
          ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_var(--color-primary)_inset,0_10px_30px_-12px_var(--color-primary)]'
          : 'border-border bg-card',
        animate && 'animate-step-in',
        reachedConstant && 'animate-constant-pulse'
      )}
      style={
        animate
          ? {
              animationDelay: reachedConstant
                ? `${index * 70}ms, ${index * 70 + 300}ms`
                : `${index * 70}ms`,
            }
          : undefined
      }
    >
      <p className="mb-3 font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Step {index + 1}
      </p>

      <div
        id={`step-${index}-arrangements`}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Biggest arrangement</span>
          <NumberTiles digits={step.descendingDigits} />
        </div>

        <span className="self-start font-heading text-2xl font-bold text-primary sm:self-center">
          &minus;
        </span>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Smallest arrangement</span>
          <NumberTiles digits={step.ascendingDigits} />
        </div>
      </div>

      <div
        id={`step-${index}-result`}
        className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4"
      >
        <span className="font-heading text-2xl font-bold text-foreground">=</span>
        <NumberTiles digits={step.result.toString().padStart(4, '0').split('').map(Number)} />
        {reachedConstant && (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground sm:ml-auto">
            Kaprekar's constant
          </span>
        )}
      </div>
    </div>
  )
}
