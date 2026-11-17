import { Puzzle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { countWithSteps } from '@/lib/stats'

/** Targets from rarest to most common, so the first challenge is the hardest find. */
const TARGETS = [1, 2, 4, 5, 6, 7, 3]

interface ChallengeProps {
  /** The number on screen. */
  current: number
  /** Steps the current number took. */
  stepCount: number
  /** Which target to show; it counts up past the end of the list. */
  targetIndex: number
  onNext: () => void
}

/**
 * A small hunt that invites a second try: "Can you find a number that takes exactly 1 step?"
 *
 * @remarks It checks each run against the target. The target lives in {@link useRun}, because the end panel remounts for each run.
 */
export function Challenge({ current, stepCount, targetIndex, onNext }: ChallengeProps) {
  const target = TARGETS[targetIndex % TARGETS.length]
  const found = stepCount === target
  const steps = (
    <>
      <span className="font-mono">{target}</span> step{target === 1 ? '' : 's'}
    </>
  )

  return (
    <div id="challenge" className="flex flex-col gap-2">
      <p className="flex items-start gap-2 text-sm text-muted-foreground sm:text-base">
        {/* The margin centers the 16 px icon on the first line: 20 px line height, then 24 px from sm. */}
        <Puzzle className="mt-0.5 size-4 shrink-0 text-primary sm:mt-1" aria-hidden />
        <span>
          {found ? (
            <>
              <span className="font-semibold">Found one.</span> <span className="font-mono">{current}</span> takes
              exactly {steps}.
            </>
          ) : (
            <>
              Can you find a number that takes exactly <span className="font-semibold">{steps}</span>?{' '}
              <span className="font-mono">{countWithSteps(target).toLocaleString('en-US')}</span> numbers do.
            </>
          )}
        </span>
      </p>
      {found && (
        <Button id="next-challenge" type="button" variant="secondary" className="h-11 w-fit" onClick={onNext}>
          Next challenge
        </Button>
      )}
    </div>
  )
}
