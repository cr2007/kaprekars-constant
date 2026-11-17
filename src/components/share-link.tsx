import { Check, Link2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EASE_OUT } from '@/lib/motion'
import { shareUrl } from '@/lib/url'
import { cn } from 'cn'

/** A label layer: both share one grid cell, so the button keeps its width when the label changes. */
const LAYER = 'inline-flex items-center justify-center gap-2 transition-[opacity,scale] duration-150 motion-reduce:transition-opacity'
/** The hidden layer: faded and a little smaller, so the new label grows in. */
const HIDDEN = 'scale-90 opacity-0 motion-reduce:scale-100'

interface ShareLinkProps {
  /** The 4-digit number on screen. */
  value: string
}

/**
 * A button that copies a link to this exact run, such as `?n=1004`.
 *
 * @remarks If the clipboard is not available, it shows the link as text to copy by hand.
 */
export function ShareLink({ value }: ShareLinkProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copied = state === 'copied'

  /** Copies the run's link and shows "Copied" for 2 s. A refused clipboard shows the link as text instead. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl(value))
      setState('copied')
      // A second click restarts the 2 s, so the confirmation is never cut short.
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('failed')
    }
  }

  return (
    <div id="share-link" className="flex flex-col gap-1">
      <Button id="share-button" type="button" variant="outline" className="h-auto min-h-11 w-fit gap-2 whitespace-normal" onClick={copy}>
        <span className="grid *:col-start-1 *:row-start-1">
          <span className={cn(LAYER, copied && HIDDEN)} style={{ transitionTimingFunction: EASE_OUT }} aria-hidden={copied}>
            <Link2 className="size-4" aria-hidden />
            Share <span className="font-mono">{value}</span>
          </span>
          <span className={cn(LAYER, !copied && HIDDEN)} style={{ transitionTimingFunction: EASE_OUT }} aria-hidden={!copied}>
            <Check className="size-4" aria-hidden />
            Copied
          </span>
        </span>
      </Button>
      {/* Monospace: Endless draws I and l the same, and people may retype a URL. */}
      {state === 'failed' && <p id="share-url" className="font-mono text-xs break-all text-muted-foreground">{shareUrl(value)}</p>}
      <output className="sr-only">{state === 'copied' ? 'Link copied.' : ''}</output>
    </div>
  )
}
