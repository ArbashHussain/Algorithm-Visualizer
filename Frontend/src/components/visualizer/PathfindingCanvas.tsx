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

type PathCellGeom = {
  /** Travel direction into this cell (from previous). Null at start. */
  inDir: PathDir | null
  /** Travel direction out of this cell (to next). Null at end. */
  outDir: PathDir | null
}

/** Search-space fade duration after a path is found. */
const SEARCH_FADE_MS = 5000

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

/**
 * Structural base fill only (no search overlay, no path plate).
 * Start / end / path never get a solid identity plate.
 */
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
 * Never applied to start/end, or to cells on the reconstructed path
 * (path is icon-only — no plate during reveal or after).
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

/** Per-cell in/out directions along pathOrder (start → end). */
function buildPathGeom(pathOrder: string[]): Map<string, PathCellGeom> {
  const map = new Map<string, PathCellGeom>()
  for (let i = 0; i < pathOrder.length; i++) {
    const k = pathOrder[i]!
    const inDir = i > 0 ? dirBetween(pathOrder[i - 1]!, k) : null
    const outDir =
      i < pathOrder.length - 1 ? dirBetween(k, pathOrder[i + 1]!) : null
    map.set(k, { inDir, outDir })
  }
  return map
}

function strokeSetup(
  ctx: CanvasRenderingContext2D,
  color: string,
  cell: number,
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(1.5, cell * 0.12)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
}

function dirOffset(dir: PathDir, half: number): { x: number; y: number } {
  switch (dir) {
    case "right":
      return { x: half, y: 0 }
    case "left":
      return { x: -half, y: 0 }
    case "down":
      return { x: 0, y: half }
    case "up":
      return { x: 0, y: -half }
  }
}

function opposite(dir: PathDir): PathDir {
  switch (dir) {
    case "right":
      return "left"
    case "left":
      return "right"
    case "down":
      return "up"
    case "up":
      return "down"
  }
}

function isStraight(inDir: PathDir, outDir: PathDir): boolean {
  return inDir === outDir
}

function isHorizontal(dir: PathDir): boolean {
  return dir === "left" || dir === "right"
}

/** Directional arrow (travel toward `dir`). */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  dir: PathDir,
  color: string,
) {
  const s = cell * 0.34
  ctx.save()
  ctx.translate(cx, cy)
  const rot =
    dir === "right"
      ? 0
      : dir === "down"
        ? Math.PI / 2
        : dir === "left"
          ? Math.PI
          : -Math.PI / 2
  ctx.rotate(rot)
  strokeSetup(ctx, color, cell)

  ctx.beginPath()
  ctx.moveTo(-s * 0.85, 0)
  ctx.lineTo(s * 0.3, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(s * 0.1, -s * 0.55)
  ctx.lineTo(s * 0.85, 0)
  ctx.lineTo(s * 0.1, s * 0.55)
  ctx.stroke()
  ctx.restore()
}

/**
 * Terminal glyph on the cell immediately before end.
 * Straight approach → normal arrow; turn approach → corner arm + arrow head
 * so we never get a disconnected "| →" look.
 */
function drawTerminalArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  geom: PathCellGeom,
  color: string,
) {
  const { inDir, outDir } = geom
  if (!outDir) {
    if (inDir) drawArrow(ctx, cx, cy, cell, inDir, color)
    return
  }

  // Straight (or missing inDir): classic arrow in travel direction
  if (!inDir || isStraight(inDir, outDir)) {
    drawArrow(ctx, cx, cy, cell, outDir, color)
    return
  }

  // Turn into the exit toward end: entry arm + arrow on the exit arm
  const half = cell * 0.36
  const head = cell * 0.34
  const from = dirOffset(opposite(inDir), half)

  ctx.save()
  strokeSetup(ctx, color, cell)

  // Entry arm into center
  ctx.beginPath()
  ctx.moveTo(cx + from.x, cy + from.y)
  ctx.lineTo(cx, cy)
  ctx.stroke()

  // Short shaft toward exit, then chevron head (local coords along outDir)
  ctx.translate(cx, cy)
  const rot =
    outDir === "right"
      ? 0
      : outDir === "down"
        ? Math.PI / 2
        : outDir === "left"
          ? Math.PI
          : -Math.PI / 2
  ctx.rotate(rot)

  const shaftEnd = head * 0.35
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(shaftEnd, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(head * 0.15, -head * 0.55)
  ctx.lineTo(head * 0.85, 0)
  ctx.lineTo(head * 0.15, head * 0.55)
  ctx.stroke()
  ctx.restore()
}

/** Straight trail segment ─ or │. */
function drawStraight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  dir: PathDir,
  color: string,
) {
  const half = cell * 0.36
  ctx.save()
  strokeSetup(ctx, color, cell)
  ctx.beginPath()
  if (isHorizontal(dir)) {
    ctx.moveTo(cx - half, cy)
    ctx.lineTo(cx + half, cy)
  } else {
    ctx.moveTo(cx, cy - half)
    ctx.lineTo(cx, cy + half)
  }
  ctx.stroke()
  ctx.restore()
}

/**
 * Corner / turn piece connecting entry side → exit side
 * (└ ┘ ┌ ┐ style as two arms meeting at center).
 */
function drawTurn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  inDir: PathDir,
  outDir: PathDir,
  color: string,
) {
  const half = cell * 0.36
  const from = dirOffset(opposite(inDir), half)
  const to = dirOffset(outDir, half)

  ctx.save()
  strokeSetup(ctx, color, cell)
  ctx.beginPath()
  ctx.moveTo(cx + from.x, cy + from.y)
  ctx.lineTo(cx, cy)
  ctx.lineTo(cx + to.x, cy + to.y)
  ctx.stroke()
  ctx.restore()
}

/** Mid-path trail: straight ─/│ or a corner turn. */
function drawTrailPiece(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  geom: PathCellGeom,
  color: string,
) {
  const { inDir, outDir } = geom

  if (inDir && outDir) {
    if (isStraight(inDir, outDir)) {
      drawStraight(ctx, cx, cy, cell, outDir, color)
    } else {
      drawTurn(ctx, cx, cy, cell, inDir, outDir, color)
    }
    return
  }

  const d = outDir ?? inDir
  if (d) drawStraight(ctx, cx, cy, cell, d, color)
}

/**
 * Start: outline disc + play triangle — no cell plate.
 * Triangle faces `facing` (path leave direction); defaults to right.
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

  // Play triangle in local space (points +X), then rotate to path direction
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

  const drawFrame = useCallback((searchAlpha: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const grid = gridRef.current
    const frame = frameRef.current
    const palette = paletteRef.current

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
    const pathGeom = buildPathGeom(pathOrder)
    const pathIndex = new Map(pathOrder.map((k, i) => [k, i]))
    // Terminal arrow only after path generation finishes (pathSettled > 0)
    const showTerminalArrow = (frame?.pathSettled ?? 0) > 0
    const ink = palette.fg
    const alpha = Math.max(0, Math.min(1, searchAlpha))

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const x = ox + c * (cell + gap)
        const y = oy + r * (cell + gap)
        const k = key(r, c)
        const kind = grid.cells[r]![c]!
        const onPath = !!frame?.path.has(k)

        // Base structural fill — path cells are icon-only (no plate / tint)
        ctx.fillStyle = onPath ? palette.empty : baseFill(palette, kind)
        ctx.fillRect(x, y, cell, cell)

        // Search space (visited / frontier / current) with optional fade.
        // Skipped for path cells so trail glyphs never sit on a filled bg.
        const overlay = searchOverlay(palette, kind, k, frame)
        if (overlay && alpha > 0.001) {
          ctx.fillStyle = withAlpha(overlay, alpha)
          ctx.fillRect(x, y, cell, cell)
        }

        if (kind === "weight" && !onPath) {
          drawWeightDot(ctx, x, y, cell, palette.fg)
        }

        // Path glyphs only on mid-path cells — never on start or end.
        if (
          onPath &&
          pathOrder.length > 0 &&
          kind !== "start" &&
          kind !== "end"
        ) {
          const idx = pathIndex.get(k)
          const geom = pathGeom.get(k)
          if (idx !== undefined && geom) {
            const cx = x + cell / 2
            const cy = y + cell / 2
            const arrowIdx = pathOrder.length - 2

            if (showTerminalArrow && idx === arrowIdx) {
              // Permanent terminal arrow (turn-aware) on cell before end
              drawTerminalArrow(ctx, cx, cy, cell, geom, ink)
            } else {
              // During generation and for all other mid cells: trail only
              drawTrailPiece(ctx, cx, cy, cell, geom, ink)
            }
          }
        }

        // Start / end markers — start faces first path step when known
        if (kind === "start") {
          const startGeom = pathGeom.get(k)
          const facing = startGeom?.outDir ?? "right"
          drawStartMarker(ctx, x, y, cell, ink, facing)
        } else if (kind === "end") {
          drawEndMarker(ctx, x, y, cell, ink)
        }
      }
    }
  }, [])

  const pathFound = !!(frame?.found && frame.path.size > 0)

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

  // Redraw on state change; keep a rAF loop running while the fade is in progress
  useEffect(() => {
    let active = true

    const currentAlpha = () => {
      const start = fadeStartRef.current
      if (start === null) return 1
      return Math.max(0, 1 - (performance.now() - start) / SEARCH_FADE_MS)
    }

    const tick = () => {
      if (!active) return
      const alpha = currentAlpha()
      drawFrame(alpha)
      if (fadeStartRef.current !== null && alpha > 0) {
        fadeRafRef.current = requestAnimationFrame(tick)
      } else {
        fadeRafRef.current = 0
      }
    }

    // Cancel any prior loop, then paint immediately (and continue if fading)
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = 0
    }
    tick()

    return () => {
      active = false
      if (fadeRafRef.current) {
        cancelAnimationFrame(fadeRafRef.current)
        fadeRafRef.current = 0
      }
    }
  }, [frame, grid, palette, drawFrame, pathFound])

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
      drawFrame(searchAlpha)
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
