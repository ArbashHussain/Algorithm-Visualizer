import { useEffect, useRef } from "react"
import { prefersReducedMotion, usePreviewTheme } from "./usePreviewTheme"

const COLS = 11
const ROWS = 7
const STEP_MS = 55
const HOLD_MS = 900
const SEARCH_FADE_MS = 5000

type Cell = 0 | 1
type Dir = "up" | "down" | "left" | "right"

function buildMaze(): Cell[][] {
  const g: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0 as Cell),
  )
  const walls: [number, number][] = [
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [5, 3],
    [5, 4],
    [3, 4],
    [3, 5],
    [3, 6],
    [3, 7],
    [4, 7],
    [6, 5],
    [1, 8],
    [2, 8],
    [3, 8],
  ]
  for (const [r, c] of walls) {
    if (g[r]?.[c] !== undefined) g[r]![c] = 1
  }
  g[0]![0] = 0
  g[ROWS - 1]![COLS - 1] = 0
  return g
}

type Phase = "search" | "path" | "hold"

function dirBetween(
  a: { r: number; c: number },
  b: { r: number; c: number },
): Dir | null {
  const dr = b.r - a.r
  const dc = b.c - a.c
  if (dr === 0 && dc === 1) return "right"
  if (dr === 0 && dc === -1) return "left"
  if (dr === 1 && dc === 0) return "down"
  if (dr === -1 && dc === 0) return "up"
  return null
}

function opposite(dir: Dir): Dir {
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

function dirOffset(dir: Dir, half: number) {
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  dir: Dir,
  color: string,
) {
  const s = size * 0.32
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
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.1)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
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

function drawStraight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  dir: Dir,
  color: string,
) {
  const half = size * 0.34
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.2, size * 0.12)
  ctx.lineCap = "round"
  ctx.beginPath()
  if (dir === "left" || dir === "right") {
    ctx.moveTo(cx - half, cy)
    ctx.lineTo(cx + half, cy)
  } else {
    ctx.moveTo(cx, cy - half)
    ctx.lineTo(cx, cy + half)
  }
  ctx.stroke()
  ctx.restore()
}

function drawTurn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  inDir: Dir,
  outDir: Dir,
  color: string,
) {
  const half = size * 0.34
  const from = dirOffset(opposite(inDir), half)
  const to = dirOffset(outDir, half)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.2, size * 0.12)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(cx + from.x, cy + from.y)
  ctx.lineTo(cx, cy)
  ctx.lineTo(cx + to.x, cy + to.y)
  ctx.stroke()
  ctx.restore()
}

function drawTerminalArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  inDir: Dir | null,
  outDir: Dir,
  color: string,
) {
  if (!inDir || inDir === outDir) {
    drawArrow(ctx, cx, cy, size, outDir, color)
    return
  }
  const half = size * 0.34
  const head = size * 0.32
  const from = dirOffset(opposite(inDir), half)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.2, size * 0.12)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(cx + from.x, cy + from.y)
  ctx.lineTo(cx, cy)
  ctx.stroke()
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
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(head * 0.35, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(head * 0.15, -head * 0.55)
  ctx.lineTo(head * 0.85, 0)
  ctx.lineTo(head * 0.15, head * 0.55)
  ctx.stroke()
  ctx.restore()
}

/** Mini BFS: expand → trail path (no arrows while drawing) → terminal arrow → fade search. */
export default function PathfindingPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palette = usePreviewTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let running = true
    let grid = buildMaze()
    const start = { r: 0, c: 0 }
    const goal = { r: ROWS - 1, c: COLS - 1 }

    let visited: boolean[][] = []
    let parent: ({ r: number; c: number } | null)[][] = []
    let queue: { r: number; c: number }[] = []
    let order: { r: number; c: number }[] = []
    let path: { r: number; c: number }[] = []
    let pathIdx = 0
    let pathComplete = false
    let orderIdx = 0
    let phase: Phase = "search"
    let last = performance.now()
    let holdUntil = 0
    let fadeStart: number | null = null
    let frontier: { r: number; c: number } | null = null

    const reset = () => {
      grid = buildMaze()
      visited = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => false),
      )
      parent = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => null),
      )
      queue = [{ ...start }]
      visited[start.r]![start.c] = true
      order = []
      path = []
      pathIdx = 0
      pathComplete = false
      orderIdx = 0
      phase = "search"
      fadeStart = null
      frontier = start
    }

    const key = (r: number, c: number) => `${r},${c}`

    const reconstruct = () => {
      const p: { r: number; c: number }[] = []
      let cur: { r: number; c: number } | null = goal
      const seen = new Set<string>()
      while (cur && !seen.has(key(cur.r, cur.c))) {
        seen.add(key(cur.r, cur.c))
        p.push(cur)
        cur = parent[cur.r]![cur.c]!
      }
      p.reverse()
      path = p
    }

    const stepSearch = () => {
      if (queue.length === 0) {
        phase = "hold"
        holdUntil = performance.now() + HOLD_MS
        return
      }
      const cur = queue.shift()!
      frontier = cur
      order.push(cur)
      orderIdx = order.length

      if (cur.r === goal.r && cur.c === goal.c) {
        reconstruct()
        phase = "path"
        pathIdx = 0
        fadeStart = performance.now()
        return
      }

      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]
      for (const [dr, dc] of dirs) {
        const nr = cur.r + dr!
        const nc = cur.c + dc!
        if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue
        if (grid[nr]![nc] === 1) continue
        if (visited[nr]![nc]) continue
        visited[nr]![nc] = true
        parent[nr]![nc] = cur
        queue.push({ r: nr, c: nc })
      }
    }

    const stepPath = () => {
      pathIdx++
      if (pathIdx >= path.length) {
        pathComplete = true
        phase = "hold"
        holdUntil = performance.now() + HOLD_MS + SEARCH_FADE_MS * 0.35
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (now: number) => {
      const { width: w, height: h } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, w, h)

      const gap = 2
      const cellW = (w - gap * (COLS - 1)) / COLS
      const cellH = (h - gap * (ROWS - 1)) / ROWS
      const cell = Math.min(cellW, cellH)

      const visitedSet = new Set(
        order.slice(0, orderIdx).map((c) => key(c.r, c.c)),
      )
      const shownPath = path.slice(
        0,
        pathComplete ? path.length : Math.min(pathIdx + 1, path.length),
      )
      const pathSet = new Set(shownPath.map((c) => key(c.r, c.c)))
      const ink = palette.fg
      const arrowIdx = shownPath.length - 2
      const searchAlpha =
        fadeStart === null
          ? 1
          : Math.max(0, 1 - (now - fadeStart) / SEARCH_FADE_MS)

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * (cellW + gap)
          const y = r * (cellH + gap)
          const k = key(r, c)
          const isStart = r === start.r && c === start.c
          const isGoal = r === goal.r && c === goal.c

          // Base
          if (grid[r]![c] === 1) {
            ctx.fillStyle = palette.fg
            ctx.globalAlpha = 0.85
          } else {
            ctx.fillStyle = palette.muted
            ctx.globalAlpha = 0.35
          }
          ctx.fillRect(x, y, cellW, cellH)
          ctx.globalAlpha = 1

          // Search overlay (fades out after path found; never on path cells)
          if (!isStart && !isGoal && !pathSet.has(k) && searchAlpha > 0.01) {
            let overlay: string | null = null
            let oa = 0
            if (frontier && frontier.r === r && frontier.c === c) {
              overlay = palette.fg
              oa = 0.55 * searchAlpha
            } else if (visitedSet.has(k)) {
              overlay = palette.accent
              oa = 0.45 * searchAlpha
            }
            if (overlay) {
              ctx.fillStyle = overlay
              ctx.globalAlpha = oa
              ctx.fillRect(x, y, cellW, cellH)
              ctx.globalAlpha = 1
            }
          }

          const cx = x + cellW / 2
          const cy = y + cellH / 2

          // Path: trail while generating; terminal arrow only when complete
          if (pathSet.has(k) && !isStart && !isGoal) {
            const pi = shownPath.findIndex((p) => p.r === r && p.c === c)
            if (pi >= 0) {
              const prev = pi > 0 ? shownPath[pi - 1]! : null
              const next =
                pi < shownPath.length - 1 ? shownPath[pi + 1]! : null
              const inDir = prev ? dirBetween(prev, shownPath[pi]!) : null
              const outDir = next ? dirBetween(shownPath[pi]!, next) : null

              if (pathComplete && pi === arrowIdx && outDir) {
                drawTerminalArrow(ctx, cx, cy, cell, inDir, outDir, ink)
              } else if (inDir && outDir) {
                if (inDir === outDir) {
                  drawStraight(ctx, cx, cy, cell, outDir, ink)
                } else {
                  drawTurn(ctx, cx, cy, cell, inDir, outDir, ink)
                }
              } else {
                const d = outDir ?? inDir
                if (d) drawStraight(ctx, cx, cy, cell, d, ink)
              }
            }
          }

          if (isStart) {
            const rr = Math.min(cellW, cellH) * 0.3
            ctx.strokeStyle = ink
            ctx.fillStyle = ink
            ctx.lineWidth = Math.max(1, cell * 0.08)
            ctx.beginPath()
            ctx.arc(cx, cy, rr, 0, Math.PI * 2)
            ctx.stroke()

            // Face first path step when known; otherwise default right
            let facing: Dir = "right"
            if (shownPath.length >= 2) {
              const d = dirBetween(shownPath[0]!, shownPath[1]!)
              if (d) facing = d
            }
            const rot =
              facing === "right"
                ? 0
                : facing === "down"
                  ? Math.PI / 2
                  : facing === "left"
                    ? Math.PI
                    : -Math.PI / 2
            const ts = rr * 0.48
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(rot)
            ctx.beginPath()
            ctx.moveTo(-ts * 0.4, -ts * 0.85)
            ctx.lineTo(ts * 0.95, 0)
            ctx.lineTo(-ts * 0.4, ts * 0.85)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
          }

          if (isGoal) {
            const ro = Math.min(cellW, cellH) * 0.32
            ctx.strokeStyle = ink
            ctx.fillStyle = ink
            ctx.lineWidth = Math.max(1, cell * 0.08)
            ctx.beginPath()
            ctx.arc(cx, cy, ro, 0, Math.PI * 2)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(cx, cy, ro * 0.55, 0, Math.PI * 2)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(cx, cy, ro * 0.22, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    const loop = (now: number) => {
      if (!running) return
      if (!prefersReducedMotion()) {
        if (phase === "hold") {
          if (now >= holdUntil) {
            reset()
            last = now
          }
        } else if (now - last >= STEP_MS) {
          last = now
          if (phase === "search") stepSearch()
          else if (phase === "path") stepPath()
        }
      } else if (order.length === 0) {
        while (phase === "search") stepSearch()
        pathIdx = path.length
        pathComplete = true
        phase = "hold"
        holdUntil = Infinity
        fadeStart = performance.now() - SEARCH_FADE_MS
      }
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    reset()
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
