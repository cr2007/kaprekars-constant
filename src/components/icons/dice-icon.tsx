import { type CSSProperties, useEffect, useId, useRef } from 'react'
import { cn } from 'cn'
import { type Pair, REST_PAIR, rollPair } from '@/lib/dice-roll'
import { EASE_OUT, reducedMotion } from '@/lib/motion'

/** Swap times in ms, both on EASE_OUT. Enter answers the user; leave is not slower. */
const ENTER_MS = 200
const LEAVE_MS = 180

/**
 * A leave commits only after this many ms with no new enter. S Pen hover
 * flickers enter and leave every 30 to 50 ms at the button edge.
 */
const LEAVE_DELAY_MS = 120

/**
 * The pointer events that start and end the hover, per `pointerType`. A
 * mouse and a pen (S Pen hover included) use enter and leave. Touch has no
 * hover, so it uses press and release.
 */
const ENTER: Record<string, string> = { mouse: 'pointerenter', pen: 'pointerenter', touch: 'pointerdown' }
const LEAVE: Record<string, string[]> = { mouse: ['pointerleave'], pen: ['pointerleave'], touch: ['pointerup', 'pointercancel'] }
const POINTER_EVENTS = ['pointerenter', 'pointerleave', 'pointerdown', 'pointerup', 'pointercancel']

/** Perspective distance as a multiple of the icon width: mild, so a 20 px icon does not warp. */
const PERSPECTIVE = 3

/** Pip spots per face, as [dx, dy] from the die centre in pip steps. */
const CORNERS = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
const FACES: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: CORNERS,
  5: [...CORNERS, [0, 0]],
  // Rows 1.2 steps apart, pips 0.85 x radius: even rows merge into bars at 20 px, DPR 1 (measured).
  6: [-1.2, 0, 1.2].flatMap((dy) => [[-1, dy], [1, dy]]),
}
const SIX_R = 0.85

/**
 * Each die: its square in the 24-unit viewBox, pip step and radius, tilt at
 * rest, turn direction, and swapped pose as [x %, y %, deg] of the box (9
 * units down or up, 2 sideways so the dice stay apart as they pass). Each
 * die is its own `<svg>`, because Chromium flattens 3D transforms on SVG
 * children into a 2D shear.
 */
const DICE = {
  back: { x: 9, y: 1, size: 11, rx: 2.2, step: 2.9, r: 1.15, tilt: -18, dir: -1, to: [8.333, 37.5, 18] },
  front: { x: 2, y: 9, size: 13, rx: 2.6, step: 3.4, r: 1.3, tilt: 0, dir: 1, to: [-8.333, -37.5, -18] },
}
type Part = keyof typeof DICE
type Die = (typeof DICE)[Part]
const PARTS: Part[] = ['back', 'front']

/**
 * A die's keyframe at swap progress `p` (0 rest, 1 swapped). It turns a
 * quarter: to edge-on at p = 0.5 on the near side, then from the other edge
 * back to square on the far side, where the rolled face shows.
 */
function pose(die: Die, p: number, far: boolean, depth: number): Keyframe {
  const [x, y, deg] = die.to
  return {
    translate: `${x * p}% ${y * p}%`,
    rotate: `${deg * p}deg`,
    transform: `perspective(${depth}px) rotateX(${die.dir * 180 * (far ? p - 1 : p)}deg)`,
  }
}

/**
 * The keyframe points from progress `from` to `to`, as [p, far side]. A
 * path that crosses the edge-on moment gets two points at p = 0.5, so the
 * face and the turn jump there and nowhere else.
 */
function path(from: number, to: number): [number, boolean][] {
  const points: [number, boolean][] = [[from, from >= 0.5]]
  if (from >= 0.5 !== to >= 0.5) points.push([0.5, from >= 0.5], [0.5, to >= 0.5])
  return [...points, [to, to >= 0.5]]
}

/** One die as its own `<svg>`: a mask with a group of pip holes per face (only `face` shows) and the filled square. */
function Die({ part, className, style }: { part: Part; className?: string; style?: CSSProperties }) {
  const face = REST_PAIR[PARTS.indexOf(part)]
  const id = useId()
  const die = DICE[part]
  const cx = die.x + die.size / 2
  const cy = die.y + die.size / 2
  return (
    <svg data-part={part} viewBox="0 0 24 24" className={cn('overflow-visible', className)} style={style} focusable="false" aria-hidden>
      <mask id={id} maskUnits="userSpaceOnUse">
        <rect x={die.x} y={die.y} width={die.size} height={die.size} rx={die.rx} fill="white" />
        {Object.entries(FACES).map(([f, spots]) => (
          <g key={f} data-face={f} style={{ opacity: Number(f) === face ? 1 : 0 }}>
            {spots.map(([dx, dy]) => (
              <circle key={`${dx} ${dy}`} cx={cx + dx * die.step} cy={cy + dy * die.step} r={f === '6' ? die.r * SIX_R : die.r} fill="black" />
            ))}
          </g>
        ))}
      </mask>
      <g transform={`rotate(${die.tilt} ${cx} ${cy})`}>
        <rect x={die.x} y={die.y} width={die.size} height={die.size} rx={die.rx} fill="currentColor" mask={`url(#${id})`} />
      </g>
    </svg>
  )
}

/**
 * Two solid dice, drawn in a 24-unit box like a lucide icon, that roll on
 * hover. The pips are holes cut by a mask, so the icon reads on any
 * button background. When the pointer
 * enters the nearest `[data-dice-trigger]` or `button`, the dice swap places
 * with a quarter turn onto a new random pair of faces. They stay there until
 * the pointer leaves, then turn back onto 2 and 3. Keyboard focus and
 * reduced motion change the faces with no motion.
 */
export function DiceIcon({ id, className }: { id?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const icon = ref.current
    const target = icon?.closest('[data-dice-trigger]') ?? icon?.closest('button')
    if (!icon || !target) return
    const dice = PARTS.map((part) => ({ die: DICE[part], el: icon.querySelector<SVGSVGElement>(`[data-part="${part}"]`)! }))
    let owner: 'pointer' | 'focus' | null = null
    let rolled: Pair = REST_PAIR
    let run = { anims: [] as Animation[], from: 0, to: 0 }
    let leaveTimer = 0

    /** Swap progress now, read from the running motion, so an interrupt starts where the dice are. */
    function progress(): number {
      const t = run.anims[0]?.effect?.getComputedTiming().progress
      return t == null ? run.to : run.from + (run.to - run.from) * t
    }

    /** Puts the dice at side `side` and shows `pair`, with no motion. */
    function settle(side: number, pair: Pair) {
      dice.forEach(({ die, el }, i) => {
        el.style.translate = side ? `${die.to[0]}% ${die.to[1]}%` : ''
        el.style.rotate = side ? `${die.to[2]}deg` : ''
        el.querySelectorAll<SVGGElement>('[data-face]').forEach((g) => (g.style.opacity = Number(g.dataset.face) === pair[i] ? '1' : '0'))
      })
    }

    /** Moves the dice to side `to` (0 rest, 1 swapped) from where they are now. `still` changes only the faces. */
    function go(to: 0 | 1, still: boolean) {
      // Step 1: read where the dice are, then stop the old motion.
      const from = still ? to : progress()
      run.anims.forEach((animation) => animation.cancel())
      run = { anims: [], from, to: still ? 0 : to }
      // Step 2: the end state becomes the base style, so the dice stay there when the motion ends.
      settle(still ? 0 : to, to ? rolled : REST_PAIR)
      if (from === to) return
      // Step 3: play from `from` to `to`; a shorter path takes a shorter time.
      const options = { duration: (to ? ENTER_MS : LEAVE_MS) * Math.abs(to - from), easing: EASE_OUT }
      const points = path(from, to)
      const offset = (p: number) => (p - from) / (to - from)
      const depth = icon!.getBoundingClientRect().width * PERSPECTIVE
      const tracks: [Element, Keyframe[]][] = []
      dice.forEach(({ die, el }, i) => {
        tracks.push([el, points.map(([p, far]) => ({ ...pose(die, p, far, depth), offset: offset(p) }))])
        for (const face of new Set([REST_PAIR[i], rolled[i]])) {
          tracks.push([el.querySelector(`[data-face="${face}"]`)!, points.map(([p, far]) => ({ opacity: (far ? rolled : REST_PAIR)[i] === face ? 1 : 0, offset: offset(p) }))])
        }
      })
      // Reduced motion plays nothing: the base style already shows the end state. Track 0 is a die, which `progress` reads.
      run.anims = reducedMotion() ? [] : tracks.map(([el, keyframes]) => el.animate(keyframes, options))
    }

    /** Starts the hover for `source`. A second enter while in, or a re-enter inside the leave delay, keeps the faces. */
    function enter(source: 'pointer' | 'focus') {
      if (owner === source) {
        clearTimeout(leaveTimer)
        return
      }
      if (owner) return
      owner = source
      const still = source === 'focus' || reducedMotion()
      // Roll only while the rest faces show, so a face never changes outside the edge-on moment.
      if (still || progress() < 0.5) rolled = rollPair(rolled)
      go(1, still)
    }

    /** Ends the hover for `source`: at once for focus, after the leave delay for a pointer. */
    function leave(source: 'pointer' | 'focus') {
      if (owner !== source) return
      clearTimeout(leaveTimer)
      const commit = () => {
        owner = null
        go(0, source === 'focus' || reducedMotion())
      }
      if (source === 'focus') commit()
      else leaveTimer = window.setTimeout(commit, LEAVE_DELAY_MS)
    }

    /** Maps a pointer event to enter or leave by its `pointerType`. Other events do nothing. */
    const onPointer = (event: Event) => {
      const type = (event as PointerEvent).pointerType
      if (ENTER[type] === event.type) enter('pointer')
      else if (LEAVE[type]?.includes(event.type)) leave('pointer')
    }
    /** Rolls on keyboard focus only: a mouse or touch press also focuses the button, but not `:focus-visible`. */
    const onFocus = (event: Event) => {
      if ((event.target as Element).matches(':focus-visible')) enter('focus')
    }
    /** Sets faces 2 and 3 again when focus leaves. */
    const onBlur = () => leave('focus')
    POINTER_EVENTS.forEach((type) => target.addEventListener(type, onPointer))
    target.addEventListener('focusin', onFocus)
    target.addEventListener('focusout', onBlur)
    return () => {
      POINTER_EVENTS.forEach((type) => target.removeEventListener(type, onPointer))
      target.removeEventListener('focusin', onFocus)
      target.removeEventListener('focusout', onBlur)
      clearTimeout(leaveTimer)
      run.anims.forEach((animation) => animation.cancel())
    }
  }, [])

  return (
    <span ref={ref} id={id} data-dice className={cn('relative inline-block shrink-0', className)} aria-hidden>
      {PARTS.map((part) => (
        <Die
          key={part}
          part={part}
          className="absolute inset-0 size-full"
          style={{ transformOrigin: `${((DICE[part].x + DICE[part].size / 2) / 24) * 100}% ${((DICE[part].y + DICE[part].size / 2) / 24) * 100}%` }}
        />
      ))}
    </span>
  )
}
