import { useEffect, useRef } from "react"
import { prefersReducedMotion, usePreviewTheme } from "./usePreviewTheme"

const LAYERS: number[] = [3, 4, 3, 2]
const STEP_MS = 380
const HOLD_MS = 600

type Node = { x: number; y: number; layer: number; index: number }

/** Mini feed-forward network: activations pulse layer by layer. */
export default function AIPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palette = usePreviewTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let running = true
    let activeLayer = 0
    let last = performance.now()
    let holdUntil = 0
    let holding = false
    let nodes: Node[] = []
    let edges: [Node, Node][] = []

    const layout = (w: number, h: number) => {
      nodes = []
      edges = []
      const padX = w * 0.08
      const padY = h * 0.12
      const usableW = w - padX * 2
      const usableH = h - padY * 2
      const layerCount = LAYERS.length

      const byLayer: Node[][] = []
      for (let L = 0; L < layerCount; L++) {
        const count = LAYERS[L]!
        const x =
          padX +
          (layerCount <= 1 ? usableW / 2 : (L / (layerCount - 1)) * usableW)
        const layerNodes: Node[] = []
        for (let i = 0; i < count; i++) {
          const y =
            count <= 1
              ? padY + usableH / 2
              : padY + (i / (count - 1)) * usableH
          const node = { x, y, layer: L, index: i }
          layerNodes.push(node)
          nodes.push(node)
        }
        byLayer.push(layerNodes)
      }

      for (let L = 0; L < layerCount - 1; L++) {
        for (const a of byLayer[L]!) {
          for (const b of byLayer[L + 1]!) {
            edges.push([a, b])
          }
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layout(width, height)
    }

    const draw = (t: number) => {
      const { width: w, height: h } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, w, h)

      const pulse = 0.5 + 0.5 * Math.sin(t * 0.004)

      // Edges
      for (const [a, b] of edges) {
        const active =
          a.layer === activeLayer - 1 ||
          (a.layer === activeLayer && b.layer === activeLayer + 1) ||
          (holding && a.layer < LAYERS.length - 1)
        const onPath =
          a.layer < activeLayer && b.layer <= activeLayer

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        if (active && !holding) {
          ctx.strokeStyle = palette.fg
          ctx.globalAlpha = 0.35 + pulse * 0.25
          ctx.lineWidth = 1.25
        } else if (onPath || holding) {
          ctx.strokeStyle = palette.accent
          ctx.globalAlpha = 0.35
          ctx.lineWidth = 1
        } else {
          ctx.strokeStyle = palette.muted
          ctx.globalAlpha = 0.45
          ctx.lineWidth = 1
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Nodes
      const r = Math.max(3.5, Math.min(w, h) * 0.045)
      for (const n of nodes) {
        const isActive = n.layer === activeLayer && !holding
        const isDone = n.layer < activeLayer || holding

        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)

        if (isActive) {
          ctx.fillStyle = palette.fg
          ctx.globalAlpha = 0.85 + pulse * 0.15
        } else if (isDone) {
          ctx.fillStyle = palette.accent
          ctx.globalAlpha = 0.75
        } else {
          ctx.fillStyle = palette.muted
          ctx.globalAlpha = 0.7
        }
        ctx.fill()
        ctx.globalAlpha = 1

        // Ring on active layer
        if (isActive) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r + 2.5 + pulse * 1.5, 0, Math.PI * 2)
          ctx.strokeStyle = palette.fg
          ctx.globalAlpha = 0.35
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
    }

    const loop = (now: number) => {
      if (!running) return
      if (!prefersReducedMotion()) {
        if (holding) {
          if (now >= holdUntil) {
            holding = false
            activeLayer = 0
            last = now
          }
        } else if (now - last >= STEP_MS) {
          last = now
          activeLayer++
          if (activeLayer >= LAYERS.length) {
            holding = true
            activeLayer = LAYERS.length - 1
            holdUntil = now + HOLD_MS
          }
        }
      } else {
        activeLayer = LAYERS.length - 1
        holding = true
      }
      draw(now)
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

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}
