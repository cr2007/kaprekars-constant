import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { Playback } from '@/hooks/use-playback'
import { cn } from 'cn'

const BAR_BUTTON =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 font-semibold text-foreground outline-none transition-[color,background-color,scale] duration-150 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-97 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:active:scale-100 motion-reduce:active:scale-100 sm:px-4 @max-[20rem]:min-w-0 @max-[20rem]:flex-1 @max-[20rem]:px-0'

/** A button label that hides (but stays for screen readers) when the bar is narrower than 20rem, its width with labels. */
const LABEL = '@max-[20rem]:sr-only'

/**
 * Back, Play and Next under the stage, like a player's controls.
 *
 * @remarks
 * - It sits in flow, not sticky: on a short screen a stuck bar covered the lower rows of the stage.
 * - Below 20rem (a 320 px screen, or large text) the bar fills the column, and its buttons share the width and show only their icons.
 * - Play reads Pause while playing and Replay at the end. See {@link usePlayback}.
 *
 * @param last - The index of the run's last step.
 */
export function PlaybackBar({ play, last }: { play: Playback; last: number }) {
  const label = play.playing ? 'Pause' : play.index >= last ? 'Replay' : 'Play'
  const Icon = play.playing ? Pause : label === 'Replay' ? RotateCcw : Play

  return (
    <div id="playback-bar" className="@container">
      <fieldset className="mx-auto flex w-fit items-center gap-2 rounded-full @max-[20rem]:w-full border border-border bg-card p-1.5 shadow-sm">
        <legend className="sr-only">Playback</legend>
        {/* aria-disabled, not disabled: the button keeps focus when it ends the run. */}
        <button id="back-button" type="button" className={BAR_BUTTON} aria-disabled={play.index === 0} onClick={() => play.go(play.index - 1)}>
          <ChevronLeft className="size-5" aria-hidden />
          <span className={LABEL}>Back</span>
        </button>
        <button
          id="play-button"
          type="button"
          className={cn(BAR_BUTTON, 'min-w-28 bg-primary text-primary-foreground hover:bg-primary/85')}
          onClick={play.toggle}
        >
          <Icon className="size-5" aria-hidden />
          <span className={LABEL}>{label}</span>
        </button>
        <button id="next-button" type="button" className={BAR_BUTTON} aria-disabled={play.index >= last} onClick={() => play.go(play.index + 1)}>
          <span className={LABEL}>Next</span>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </fieldset>
    </div>
  )
}
