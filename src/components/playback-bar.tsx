import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { Playback } from '@/hooks/use-playback'
import { cn } from 'cn'

const BAR_BUTTON =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 font-semibold text-foreground outline-none transition-[color,background-color,scale] duration-150 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-97 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100 motion-reduce:active:scale-100 sm:px-4'

/**
 * Back, Play and Next under the stage, like a player's controls. It sits
 * in flow, not sticky: on a short screen a stuck bar covered the lower
 * rows of the stage. `last` is the index of the run's last step.
 */
export function PlaybackBar({ play, last }: { play: Playback; last: number }) {
  const label = play.playing ? 'Pause' : play.index >= last ? 'Replay' : 'Play'
  const Icon = play.playing ? Pause : label === 'Replay' ? RotateCcw : Play

  return (
    <div id="playback-bar">
      <fieldset className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-sm">
        <legend className="sr-only">Playback</legend>
        {/* aria-disabled, not disabled: the button keeps focus when it ends the run. */}
        <button id="back-button" type="button" className={BAR_BUTTON} aria-disabled={play.index === 0} onClick={() => play.go(play.index - 1)}>
          <ChevronLeft className="size-5" aria-hidden />
          Back
        </button>
        <button
          id="play-button"
          type="button"
          className={cn(BAR_BUTTON, 'min-w-28 bg-primary text-primary-foreground hover:bg-primary/85')}
          onClick={play.toggle}
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </button>
        <button id="next-button" type="button" className={BAR_BUTTON} aria-disabled={play.index >= last} onClick={() => play.go(play.index + 1)}>
          Next
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </fieldset>
    </div>
  )
}
