import { useId } from 'react'

interface SolidDiceIconProps {
  className?: string
}

/**
 * Two overlapping filled dice, drawn as a 24x24 SVG to match lucide's
 * sizing conventions. This mirrors lucide's own `Dices` icon (two dice, to
 * suggest randomness) but filled solid, since lucide-react ships stroke
 * icons only and has no solid variant.
 *
 * Each die's pips are cut from its fill with an SVG mask rather than drawn
 * in a background color, so the icon reads correctly over any button
 * background. The back die is a rotated copy of the same shape, drawn
 * first so the front die naturally overlaps it.
 */
export function SolidDiceIcon({ className }: SolidDiceIconProps) {
  const id = useId()
  const backMaskId = `${id}-back`
  const frontMaskId = `${id}-front`

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <mask id={backMaskId} maskUnits="userSpaceOnUse">
        <rect x="9" y="1" width="11" height="11" rx="2.2" fill="white" />
        <circle cx="11.6" cy="3.6" r="1.15" fill="black" />
        <circle cx="17.4" cy="9.4" r="1.15" fill="black" />
      </mask>
      <mask id={frontMaskId} maskUnits="userSpaceOnUse">
        <rect x="2" y="9" width="13" height="13" rx="2.6" fill="white" />
        <circle cx="5.1" cy="12.1" r="1.3" fill="black" />
        <circle cx="8.5" cy="15.5" r="1.3" fill="black" />
        <circle cx="11.9" cy="18.9" r="1.3" fill="black" />
      </mask>

      <g transform="rotate(-18 14.5 6.5)">
        <rect x="9" y="1" width="11" height="11" rx="2.2" fill="currentColor" mask={`url(#${backMaskId})`} />
      </g>
      <rect x="2" y="9" width="13" height="13" rx="2.6" fill="currentColor" mask={`url(#${frontMaskId})`} />
    </svg>
  )
}
