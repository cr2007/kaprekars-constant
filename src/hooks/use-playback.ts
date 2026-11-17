import { useEffect, useRef, useState } from 'react'
import { type KaprekarStep, pad4, stepsToConstant } from '@/lib/kaprekar'
import { stepMotionMs } from '@/lib/stage-motion'

/** Time on a step at rest, after its motion, before autoplay moves on. */
const HOLD_MS = 250

/** One step as a sentence for the live region. */
export function stepSentence(steps: KaprekarStep[], i: number): string {
  const s = steps[i]
  return `Step ${i + 1} of ${steps.length}: ${pad4(s.descendingNumber)} minus ${pad4(s.ascendingNumber)} equals ${pad4(s.result)}.`
}

/** The sentence for the end of a run. The loop step does not count. */
export function endSentence(steps: KaprekarStep[]): string {
  const n = stepsToConstant(steps)
  return `Reached 6174 in ${n} step${n === 1 ? '' : 's'}.`
}

/** True when a key press belongs to a field that handles arrows itself. */
function ownsArrows(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select') !== null
}

/** What {@link usePlayback} returns: the step on the stage, the autoplay state and the controls. */
export interface Playback {
  /** The step on the stage. */
  index: number
  /** The furthest step shown in this run. The trail hides steps past it. */
  reached: number
  /** True while autoplay runs. */
  playing: boolean
  /** False after Back, Next, an arrow key, or a trail pick: the stage shows that step at rest. */
  animate: boolean
  /** Goes up each time Play starts, so the stage plays the shown step again before autoplay moves on. */
  replay: number
  /** Text for the one polite live region. */
  message: string
  /** Shows step `i`, pauses, and announces its equation. */
  go: (i: number) => void
  /** Plays from the current step, or from step 1 at the end. Pauses while playing. */
  toggle: () => void
}

/**
 * Which step the stage shows, and the timer that plays through a run.
 *
 * @remarks
 * - Every run plays from step 1, also a run from `?n=` (a shared link), so its reader sees the routine.
 * - Left and Right step back and forward, outside a field.
 * - {@link StageStep} plays the motion. This hook only waits for it with {@link stepMotionMs}.
 */
export function usePlayback(steps: KaprekarStep[], runId: number): Playback {
  const last = steps.length - 1
  const [index, setIndex] = useState(0)
  const [reached, setReached] = useState(0)
  const [playing, setPlaying] = useState(steps.length > 1)
  const [animate, setAnimate] = useState(true)
  const [message, setMessage] = useState(() => (steps.length === 1 ? endSentence(steps) : ''))
  const [replay, setReplay] = useState(0)
  const [seen, setSeen] = useState({ runId, length: steps.length })
  /** The step on the stage and the time its motion ends. */
  const motion = useRef({ key: '', end: 0 })

  // Step 1: react to a new run, a cleared run, or the loop step during render, so no frame pairs the old index with new steps.
  if (seen.runId !== runId || seen.length !== steps.length) {
    const grew = seen.runId === runId && steps.length === seen.length + 1
    setSeen({ runId, length: steps.length })
    setIndex(grew ? last : 0)
    setReached(grew ? last : 0)
    setAnimate(true)
    if (grew) {
      // "Do one more round": show the loop step at once, with no autoplay.
      setPlaying(false)
      setMessage(`${stepSentence(steps, last)} 6174 leads back to itself.`)
    } else {
      setPlaying(steps.length > 1)
      setMessage(steps.length === 1 ? endSentence(steps) : '')
    }
  }

  // Step 2: note when the stage's motion for a newly shown step ends. The
  // stage starts it in the same commit. A step shown at rest has none.
  useEffect(() => {
    const key = `${runId}:${index}:${replay}`
    if (motion.current.key === key) return
    motion.current = { key, end: animate && steps[index] ? performance.now() + stepMotionMs(steps[index].digits, index) : 0 }
  })

  // Step 3: while playing, wait for the step's motion and a hold, then move on. Stop at the end.
  useEffect(() => {
    if (!playing) return
    const wait = Math.max(0, motion.current.end - performance.now()) + HOLD_MS
    const id = window.setTimeout(() => {
      const next = Math.min(index + 1, last)
      setIndex(next)
      setReached((r) => Math.max(r, next))
      if (next >= last) {
        setPlaying(false)
        setMessage(endSentence(steps))
      }
    }, wait)
    return () => window.clearTimeout(id)
  }, [playing, index, last, steps])

  /** Shows step `i` at rest and pauses. */
  function go(i: number) {
    if (i < 0 || i > last) return
    setPlaying(false)
    setAnimate(false)
    setIndex(i)
    setReached((r) => Math.max(r, i))
    setMessage(stepSentence(steps, i))
  }

  /** Pauses, or plays from here (from step 1 at the end). The shown step plays again first. */
  function toggle() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (index >= last) setIndex(0)
    setReplay((t) => t + 1)
    setAnimate(true)
    setMessage('')
    setPlaying(true)
  }

  // Step 4: Left and Right step through the run from anywhere but a field.
  useEffect(() => {
    /** Moves one step on an unmodified arrow key. */
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || ownsArrows(event.target)) return
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
      if (delta === 0) return
      event.preventDefault()
      go(index + delta)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return { index, reached, playing, animate, replay, message, go, toggle }
}
