import { useCallback, useEffect, useRef, useState } from "react"

type UseStepPlayerOptions = {
  /** Milliseconds between steps while playing */
  stepMs: number
  /** Called once per step; return false to stop */
  onStep: () => boolean
  playing: boolean
}

/**
 * requestAnimationFrame-driven step player.
 * Advances `onStep` every `stepMs` while `playing` is true.
 */
export function useStepPlayer({ stepMs, onStep, playing }: UseStepPlayerOptions) {
  const onStepRef = useRef(onStep)
  const stepMsRef = useRef(stepMs)
  onStepRef.current = onStep
  stepMsRef.current = stepMs

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let alive = true

    const loop = (now: number) => {
      if (!alive) return
      if (now - last >= stepMsRef.current) {
        last = now
        const cont = onStepRef.current()
        if (!cont) {
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [playing])
}

export function usePlayingState(initial = false) {
  const [playing, setPlaying] = useState(initial)
  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => setPlaying((p) => !p), [])
  return { playing, setPlaying, play, pause, toggle }
}
