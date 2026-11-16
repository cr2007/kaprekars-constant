import { Check, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { shareUrl } from '@/lib/url'

interface ShareLinkProps {
  /** The 4-digit number on screen. */
  value: string
}

/**
 * Copies a link to this exact run (`?n=1004`). If the clipboard is not
 * available, it shows the link as text so people can copy it by hand.
 */
export function ShareLink({ value }: ShareLinkProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  /** Copies the run's link. A refused clipboard shows the link as text instead. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl(value))
      setState('copied')
      window.setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('failed')
    }
  }

  return (
    <div id="share-link" className="flex flex-col gap-1">
      <Button id="share-button" type="button" variant="outline" className="h-auto min-h-11 w-fit gap-2 whitespace-normal" onClick={copy}>
        {state === 'copied' ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        Share <span className="font-mono">{value}</span>
      </Button>
      {/* Monospace: Endless draws I and l the same, and people may retype a URL. */}
      {state === 'failed' && <p id="share-url" className="font-mono text-xs break-all text-muted-foreground">{shareUrl(value)}</p>}
      <output className="sr-only">{state === 'copied' ? 'Link copied.' : ''}</output>
    </div>
  )
}
