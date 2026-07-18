import { useCallback, useEffect, useRef } from "react"
import type { CellKind, PathDir, PathFrame } from "@/algorithms/pathfinding"
import type { GridModel } from "@/algorithms/pathfinding"
import { key, parseKey } from "@/algorithms/pathfinding"
import { useVizTheme, type VizPalette } from "@/lib/viz-theme"

type PaintMode = "wall" | "weight" | "erase" | "start" | "end"

type Props = {
  grid: GridModel
  frame: PathFrame | null
  paintMode: PaintMode
  interactive: boolean
  onPaint: (r: number, c: number, mode: PaintMode) => void
  className?: string
}

/** Search-space fade duration after a path is found. */
const SEARCH_FADE_MS = 5000
/** Full pulse cycle along the path (ms). */
const PATH_PULSE_MS = 1600
/** Radians of phase lag per path cell (traveling wave). */
const PATH_WAVE_LAG = 0.42

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function parseRgba(color: string): { r: number; g: number; b: number; a: number } {
  const m = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/,
  )
  if (!m) return { r: 128, g: 128, b: 128, a: 1 }
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] !== undefined ? Number(m[4]) : 1,
  }
}

function withAlpha(color: string, alphaMul: number): string {
  const { r, g, b, a } = parseRgba(color)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a * alphaMul))})`
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`
}

/** Structural base fill (no search overlay, no path plate). */
function baseFill(palette: VizPalette, kind: CellKind): string {
  if (kind === "start" || kind === "end") return palette.empty
  switch (kind) {
    case "wall":
      return palette.wall
    case "weight":
      return palette.weight
    default:
      return palette.empty
  }
}

/**
 * Search overlay color (visited / frontier / current), if any.
 * Never applied to start/end or path cells (path is solid red only).
 */
function searchOverlay(
  palette: VizPalette,
  kind: CellKind,
  k: string,
  frame: PathFrame | null,
): string | null {
  if (!frame || kind === "start" || kind === "end") return null
  if (frame.path.has(k)) return null
  if (frame.current === k) return palette.current
  if (frame.frontier.has(k)) return palette.frontier
  if (frame.visited.has(k)) return palette.visited
  return null
}

function dirBetween(from: string, to: string): PathDir | null {
  const a = parseKey(from)
  const b = parseKey(to)
  const dr = b.r - a.r
  const dc = b.c - a.c
  if (dr === 0 && dc === 1) return "right"
  if (dr === 0 && dc === -1) return "left"
  if (dr === 1 && dc === 0) return "down"
  if (dr === -1 && dc === 0) return "up"
  return null
}

/** First step off start — used only to orient the start play triangle. */
function startFacing(pathOrder: string[]): PathDir {
  if (pathOrder.length < 2) return "right"
  return dirBetween(pathOrder[0]!, pathOrder[1]!) ?? "right"
}

/**
 * Draw a solid cell that fully covers the inter-cell gap so the edge/border
 * is the same color as the fill (no background seam).
 */
function fillCellSeamless(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  gap: number,
  color: string,
) {
  const pad = gap / 2
  ctx.fillStyle = color
  ctx.fillRect(x - pad, y - pad, cell + gap, cell + gap)
}

/**
 * Start: outline disc + play triangle — no cell plate.
 * Triangle faces `facing` (first path step); defaults to right.
 */
function drawStartMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  ink: string,
  facing: PathDir = "right",
) {
  const cx = x + cell / 2
  const cy = y + cell / 2
  const r = cell * 0.3

  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = Math.max(1.4, cell * 0.09)

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  const rot =
    facing === "right"
      ? 0
      : facing === "down"
        ? Math.PI / 2
        : facing === "left"
          ? Math.PI
          : -Math.PI / 2
  const ts = cell * 0.14
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(-ts * 0.35, -ts * 0.72)
  ctx.lineTo(ts * 0.85, 0)
  ctx.lineTo(-ts * 0.35, ts * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** End: bullseye rings + center dot — no cell plate. */
function drawEndMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  ink: string,
) {
  const cx = x + cell / 2
  const cy = y + cell / 2
  const rOuter = cell * 0.34
  const rMid = cell * 0.2
  const rInner = cell * 0.08

  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = Math.max(1.4, cell * 0.09)

  ctx.beginPath()
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, rMid, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2)
  ctx.fill()
}

function drawWeightDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  color: string,
) {
  const cx = x + cell / 2
  const cy = y + cell / 2
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Path cell: fixed size, seamless red edges, soft glow + brightness pulse
 * (no grow / scale animation).
 */
function drawPathCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  gap: number,
  pathColor: string,
  pathIndex: number,
  pathLen: number,
  now: number,
  reducedMotion: boolean,
) {
  const { r, g, b, a: baseA } = parseRgba(pathColor)
  const cx = x + cell / 2
  const cy = y + cell / 2

  // Traveling brightness wave along the path (start → end)
  let pulse = 0.55
  if (!reducedMotion && pathLen > 0) {
    const phase =
      (now / PATH_PULSE_MS) * Math.PI * 2 - pathIndex * PATH_WAVE_LAG
    pulse = 0.5 + 0.5 * Math.sin(phase)
  }

  // Soft outer glow (no size change on the cell itself)
  if (!reducedMotion) {
    const glowPad = cell * (0.14 + 0.1 * pulse)
    const glowA = (0.1 + 0.22 * pulse) * baseA
    ctx.save()
    ctx.shadowColor = rgba(r, g, b, 0.45 + 0.3 * pulse)
    ctx.shadowBlur = cell * (0.28 + 0.35 * pulse)
    ctx.fillStyle = rgba(r, g, b, glowA)
    ctx.fillRect(
      cx - cell / 2 - glowPad * 0.2,
      cy - cell / 2 - glowPad * 0.2,
      cell + glowPad * 0.4,
      cell + glowPad * 0.4,
    )
    ctx.restore()
  }

  // Solid red plate covering the gap — border color matches fill
  const fillA = baseA * (0.82 + 0.18 * pulse)
  fillCellSeamless(ctx, x, y, cell, gap, rgba(r, g, b, fillA))

  // Subtle inner sheen (opacity only)
  if (!reducedMotion) {
    const sheenPad = cell * 0.18
    const sheenA = 0.06 + 0.16 * pulse
    ctx.fillStyle = rgba(
      Math.min(255, r + 40),
      Math.min(255, g + 30),
      Math.min(255, b + 30),
      sheenA,
    )
    ctx.fillRect(
      x + sheenPad,
      y + sheenPad,
      cell - sheenPad * 2,
      cell - sheenPad * 2,
    )
  }
}

export default function PathfindingCanvas({
  grid,
  frame,
  paintMode,
  interactive,
  onPaint,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palette = useVizTheme()
  const painting = useRef(false)
  const layoutRef = useRef({ cell: 0, gap: 1, ox: 0, oy: 0 })
  /** Timestamp when path-found fade began; null when not fading. */
  const fadeStartRef = useRef<number | null>(null)
  const fadeRafRef = useRef(0)
  const frameRef = useRef(frame)
  const gridRef = useRef(grid)
  const paletteRef = useRef(palette)
  frameRef.current = frame
  gridRef.current = grid
  paletteRef.current = palette

  const drawFrame = useCallback((searchAlpha: number, now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const grid = gridRef.current
    const frame = frameRef.current
    const palette = paletteRef.current
    const reduced = prefersReducedMotion()

    const { width: w, height: h } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, w, h)

    const gap = 1
    const cell = Math.floor(
      Math.min(
        (w - gap * (grid.cols - 1)) / grid.cols,
        (h - gap * (grid.rows - 1)) / grid.rows,
      ),
    )
    if (cell <= 0) return

    const gridW = cell * grid.cols + gap * (grid.cols - 1)
    const gridH = cell * grid.rows + gap * (grid.rows - 1)
    const ox = (w - gridW) / 2
    const oy = (h - gridH) / 2
    layoutRef.current = { cell, gap, ox, oy }

    const pathOrder = frame?.pathOrder ?? []
    const pathIndex = new Map(pathOrder.map((k, i) => [k, i]))
    const pathLen = pathOrder.length
    const ink = palette.fg
    const alpha = Math.max(0, Math.min(1, searchAlpha))

    // Pass 1: structural cells (empty / wall / weight / search overlays)
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const x = ox + c * (cell + gap)
        const y = oy + r * (cell + gap)
        const k = key(r, c)
        const kind = grid.cells[r]![c]!
        const onPath = !!frame?.path.has(k)

        if (onPath) {
          // Placeholder under path (path drawn in pass 2)
          ctx.fillStyle = palette.empty
          ctx.fillRect(x, y, cell, cell)
          continue
        }

        if (kind === "wall") {
          // Wall fill covers the gap — borders match wall color
          fillCellSeamless(ctx, x, y, cell, gap, palette.wall)
        } else {
          ctx.fillStyle = baseFill(palette, kind)
          ctx.fillRect(x, y, cell, cell)
        }

        // Search space (visited / frontier / current) with optional fade
        const overlay = searchOverlay(palette, kind, k, frame)
        if (overlay && alpha > 0.001) {
          ctx.fillStyle = withAlpha(overlay, alpha)
          ctx.fillRect(x, y, cell, cell)
        }

        if (kind === "weight") {
          drawWeightDot(ctx, x, y, cell, palette.fg)
        }
      }
    }

    // Pass 2: path cells (glow + pulse, fixed size)
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const k = key(r, c)
        if (!frame?.path.has(k)) continue
        const x = ox + c * (cell + gap)
        const y = oy + r * (cell + gap)
        const idx = pathIndex.get(k) ?? 0
        drawPathCell(
          ctx,
          x,
          y,
          cell,
          gap,
          palette.path,
          idx,
          pathLen,
          now,
          reduced,
        )
      }
    }

    // Pass 3: start / end markers above path
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const kind = grid.cells[r]![c]!
        if (kind !== "start" && kind !== "end") continue
        const x = ox + c * (cell + gap)
        const y = oy + r * (cell + gap)
        if (kind === "start") {
          drawStartMarker(ctx, x, y, cell, ink, startFacing(pathOrder))
        } else {
          drawEndMarker(ctx, x, y, cell, ink)
        }
      }
    }
  }, [])

  const pathFound = !!(frame?.found && frame.path.size > 0)
  const hasPath = !!(frame && frame.path.size > 0)

  // Arm / reset the 5s search-space fade when a path is found or cleared
  useEffect(() => {
    if (pathFound) {
      if (fadeStartRef.current === null) {
        fadeStartRef.current = performance.now()
      }
    } else {
      fadeStartRef.current = null
    }
  }, [pathFound])

  // Continuous rAF while search is fading OR path is pulsing
  useEffect(() => {
    let active = true

    const currentAlpha = () => {
      const start = fadeStartRef.current
      if (start === null) return 1
      return Math.max(0, 1 - (performance.now() - start) / SEARCH_FADE_MS)
    }

    const needsLoop = () => {
      if (prefersReducedMotion()) {
        return fadeStartRef.current !== null && currentAlpha() > 0
      }
      if (hasPath) return true
      return fadeStartRef.current !== null && currentAlpha() > 0
    }

    const tick = (now: number) => {
      if (!active) return
      const alpha = currentAlpha()
      drawFrame(alpha, now)
      if (needsLoop()) {
        fadeRafRef.current = requestAnimationFrame(tick)
      } else {
        fadeRafRef.current = 0
      }
    }

    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = 0
    }
    fadeRafRef.current = requestAnimationFrame(tick)

    return () => {
      active = false
      if (fadeRafRef.current) {
        cancelAnimationFrame(fadeRafRef.current)
        fadeRafRef.current = 0
      }
    }
  }, [frame, grid, palette, drawFrame, pathFound, hasPath])

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
      const start = fadeStartRef.current
      const searchAlpha =
        start === null
          ? 1
          : Math.max(0, 1 - (performance.now() - start) / SEARCH_FADE_MS)
      drawFrame(searchAlpha, performance.now())
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [drawFrame])

  const hit = (e: React.PointerEvent): { r: number; c: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const { cell, gap, ox, oy } = layoutRef.current
    if (cell <= 0) return null
    const c = Math.floor((x - ox) / (cell + gap))
    const r = Math.floor((y - oy) / (cell + gap))
    if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return null
    return { r, c }
  }

  const handlePointer = (e: React.PointerEvent) => {
    if (!interactive) return
    const pos = hit(e)
    if (!pos) return
    onPaint(pos.r, pos.c, paintMode)
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full touch-none"}
      role="img"
      aria-label="Pathfinding grid"
      onPointerDown={(e) => {
        if (!interactive) return
        painting.current = true
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        handlePointer(e)
      }}
      onPointerMove={(e) => {
        if (!painting.current) return
        handlePointer(e)
      }}
      onPointerUp={() => {
        painting.current = false
      }}
      onPointerCancel={() => {
        painting.current = false
      }}
    />
  )
}

export type { PaintMode }
