import { useEffect, useRef } from "react"
import { prefersReducedMotion, usePreviewTheme } from "./usePreviewTheme"

const N = 12
const STEP_MS = 140
const HOLD_MS = 700

function shuffled(): number[] {
  const a = Array.from({ length: N }, (_, i) => i + 1)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Mini insertion-sort bar chart that loops. */
export default function SortingPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palette = usePreviewTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let running = true
    let values = shuffled()
    let i = 1
    let j = 1
    let phase: "sort" | "hold" = "sort"
    let last = performance.now()
    let holdUntil = 0
    let active = -1
    let pivot = -1

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const step = () => {
      if (phase === "hold") return
      if (i >= N) {
        phase = "hold"
        holdUntil = performance.now() + HOLD_MS
        active = -1
        pivot = -1
        return
      }
      if (j > 0 && values[j - 1]! > values[j]!) {
        ;[values[j - 1], values[j]] = [values[j]!, values[j - 1]!]
        active = j - 1
        pivot = j
        j--
      } else {
        i++
        j = i
        active = j
        pivot = i
      }
    }

    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, w, h)

      const gap = 3
      const barW = (w - gap * (N - 1)) / N
      const maxH = h * 0.92
      const maxVal = N

      for (let k = 0; k < N; k++) {
        const v = values[k]!
        const bh = (v / maxVal) * maxH
        const x = k * (barW + gap)
        const y = h - bh

        if (k === active || k === pivot) {
          ctx.fillStyle = palette.fg
        } else if (phase === "hold" || k < i) {
          ctx.fillStyle = palette.accent
        } else {
          ctx.fillStyle = palette.muted
        }
        ctx.fillRect(x, y, barW, bh)
      }
    }

    const loop = (now: number) => {
      if (!running) return
      if (!prefersReducedMotion()) {
        if (phase === "hold") {
          if (now >= holdUntil) {
            values = shuffled()
            i = 1
            j = 1
            phase = "sort"
            last = now
          }
        } else if (now - last >= STEP_MS) {
          last = now
          step()
        }
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [palette])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden
    />
  )
}
