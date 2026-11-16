import { ChevronRight, ExternalLink } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { pad4 } from '@/hooks/use-playback'
import { KAPREKAR_CONSTANT, type KaprekarStep } from '@/lib/kaprekar'
import { cn } from 'cn'

const SUMMARY =
  'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'
const CHEVRON = 'size-4 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none'

interface DisclosureProps {
  id: string
  summaryId: string
  summary: ReactNode
  /** Grid placement from the caller. */
  className?: string
  onToggle?: (open: boolean) => void
  children: ReactNode
}

/** A native details/summary with the page's look: a muted card, a chevron that turns when open. */
function Disclosure({ id, summaryId, summary, className, onToggle, children }: DisclosureProps) {
  return (
    <details
      id={id}
      className={cn('group self-start rounded-2xl bg-muted/60 px-4 open:pb-4', className)}
      onToggle={onToggle && ((event) => onToggle(event.currentTarget.open))}
    >
      <summary id={summaryId} className={SUMMARY}>
        <ChevronRight className={CHEVRON} aria-hidden />
        {summary}
      </summary>
      {children}
    </details>
  )
}

/**
 * "See all steps": every step of the run as one equation per line. The
 * list renders only while open, so a closed disclosure costs nothing.
 */
export function AllSteps({ steps, className }: { steps: KaprekarStep[]; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Disclosure id="all-steps" summaryId="all-steps-summary" summary="See all steps" className={className} onToggle={setOpen}>
      {open && (
        <ol id="all-steps-list" aria-labelledby="all-steps-summary" className="flex flex-col gap-1 font-mono text-lg tabular-nums">
          {steps.map((s, i) => (
            // A flex row centres the small label on the larger digits; on the baseline it hung 2.8 px low.
            <li key={i} className="flex items-center gap-2">
              <span className="font-sans text-sm text-muted-foreground">
                Step <span className="font-mono">{i + 1}</span>:
              </span>
              <span>
                {pad4(s.descendingNumber)} &minus; {pad4(s.ascendingNumber)} ={' '}
                <span className={cn(s.result === KAPREKAR_CONSTANT && 'font-bold text-primary')}>{pad4(s.result)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Disclosure>
  )
}

/** "Where 6174 comes from": the background reading and a link to Wikipedia. */
export function OriginDetails({ className }: { className?: string }) {
  return (
    <Disclosure
      id="origin-details"
      summaryId="origin-summary"
      summary={
        <>
          Where <span className="font-mono">6174</span> comes from
        </>
      }
      className={className}
    >
      <p id="origin-text" className="max-w-prose text-pretty text-sm text-muted-foreground sm:text-base">
        The mathematician D. R. Kaprekar found this routine in <span className="font-mono">1949</span>, working with
        digits by hand. From any <span className="font-mono">4</span>-digit number with at least two different digits,
        sorting and subtracting always arrived at <span className="font-mono">6174</span>, and then stayed there. Other
        digit lengths have their own resting numbers, but <span className="font-mono">6174</span> is the famous one, and
        it carries his name.
      </p>
      <a
        id="wikipedia-link"
        href="https://en.wikipedia.org/wiki/6174_(number)"
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Read more on Wikipedia
        <ExternalLink className="size-3.5" aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Disclosure>
  )
}
