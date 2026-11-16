import { TILE_TONE } from '@/lib/tile-tone'
import { cn } from 'cn'

interface InputNoteProps {
  /** The digits in the field. */
  raw: string
  /** The validation message, or null. */
  error: string | null
}

/** A slot: 44 px, or smaller when 4 slots do not fit the note's width (a narrow screen, or large text). */
const SLOT =
  'flex size-[min(2.75rem,calc((100cqi_-_1.125rem)/4))] items-center justify-center rounded-lg font-mono text-[length:min(1.25rem,calc((100cqi_-_1.125rem)/9))] font-bold'

/**
 * What the empty stage says about the field. Four slots mirror the field:
 * typed digits are tiles, missing digits are dashed slots. Under them, one
 * line says what to do next, or why the number cannot run. It sits in the
 * stage like the steps do, not in an alert box.
 */
export function InputNote({ raw, error }: InputNoteProps) {
  // Step 1: pick the case. The field takes digits only, at most 4.
  const zero = error !== null && raw[0] === '0'
  const same = error !== null && raw.length === 4 && new Set(raw).size === 1
  const left = 4 - raw.length

  let title: React.ReactNode
  let detail: React.ReactNode = null
  if (zero) {
    title = 'Start with 1 to 9.'
    detail = 'A 0 in front makes it a 3-digit number.'
  } else if (same) {
    title = (
      <>
        <span className="font-mono">{raw}</span> stops at <span className="font-mono">0</span>.
      </>
    )
    detail = (
      <>
        Both orders are <span className="font-mono">{raw}</span>, so the difference is{' '}
        <span className="font-mono">0000</span>. Use at least two different digits.
      </>
    )
  } else if (error !== null && raw.length === 4) {
    title = error
  } else if (raw.length > 0) {
    title = (
      <>
        <span className="font-mono">{left}</span> more digit{left === 1 ? '' : 's'}.
      </>
    )
  } else {
    title = (
      <>
        Type a <span className="font-mono">4</span>-digit number, or press Random.
      </>
    )
  }

  // Step 2: the slots, then the text. The live region reads each change once.
  return (
    <div id="input-note" aria-live="polite" className="@container flex flex-col gap-3">
      <span id="input-note-slots" aria-hidden="true" className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const digit = raw[i]
          if (digit === undefined) return <span key={i} className={cn(SLOT, 'border-2 border-dashed border-muted-foreground/50')} />
          const bad = (zero && i === 0) || same
          return (
            <span
              key={i}
              className={cn(
                SLOT,
                bad
                  ? 'border-2 border-destructive text-destructive'
                  : TILE_TONE.outline
              )}
            >
              {digit}
            </span>
          )
        })}
      </span>
      <p id="input-note-title" className="text-pretty font-heading text-lg font-bold text-foreground">
        {title}
      </p>
      {detail && (
        <p id="input-note-detail" className="-mt-2 text-pretty text-base text-muted-foreground">
          {detail}
        </p>
      )}
    </div>
  )
}
