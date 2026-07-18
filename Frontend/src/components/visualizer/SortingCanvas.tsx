import { useEffect, useRef } from "react"
import type { HighlightRole } from "@/algorithms/sorting"
import { useVizTheme, type VizPalette } from "@/lib/viz-theme"

type Props = {
  values: number[]
  highlights: Record<number, HighlightRole>
  className?: string
}

function barColor(palette: VizPalette, role?: HighlightRole): string {
  if (role === "current") return palette.barActive
  if (role === "other") return palette.barOther
  if (role === "pivot") return palette.barPivot
  return palette.bar
}

export default function SortingCanvas({ values, highlights, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palette = useVizTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, w, h)
      if (!values.length) return

      const n = values.length
      const gap = n > 80 ? 1 : n > 40 ? 2 : 3
      const barW = Math.max(1, (w - gap * (n - 1)) / n)
      const minV = Math.min(...values)
      const maxV = Math.max(...values)
      const range = Math.max(1e-9, maxV - minV)
      const maxH = h * 0.92

      for (let i = 0; i < n; i++) {
        const v = values[i]!
        const t = (v - minV) / range
        const bh = Math.max(2, t * maxH)
        const x = i * (barW + gap)
        const y = h - bh
        ctx.fillStyle = barColor(palette, highlights[i])
        ctx.fillRect(x, y, barW, bh)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [values, highlights, palette])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full"}
      role="img"
      aria-label="Sorting visualization"
    />
  )
}
