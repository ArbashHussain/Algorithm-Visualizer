import { useEffect, useRef } from "react"
import { prefersReducedMotion, usePreviewTheme } from "./usePreviewTheme"

const COLS = 11
const ROWS = 7
const STEP_MS = 55
const HOLD_MS = 900
const SEARCH_FADE_MS = 5000
const PATH_PULSE_MS = 1600
const PATH_WAVE_LAG = 0.42

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

function parseRgba(color: string): { r: number; g: number; b: number; a: number } {
  const m = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/,
  )
  if (!m) return { r: 239, g: 68, b: 68, a: 1 }
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] !== undefined ? Number(m[4]) : 1,
  }
}

/** Fill covering half the gap so edges match the fill color. */
function fillSeamless(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  color: string,
) {
  const pad = gap / 2
  ctx.fillStyle = color
  ctx.fillRect(x - pad, y - pad, w + gap, h + gap)
}

/** Mini BFS: expand → glowing red path → fade search. */
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
      const reduced = prefersReducedMotion()

      const visitedSet = new Set(
        order.slice(0, orderIdx).map((c) => key(c.r, c.c)),
      )
      const shownPath = path.slice(
        0,
        pathComplete ? path.length : Math.min(pathIdx + 1, path.length),
      )
      const pathSet = new Set(shownPath.map((c) => key(c.r, c.c)))
      const pathIndex = new Map(
        shownPath.map((p, i) => [key(p.r, p.c), i] as const),
      )
      const ink = palette.fg
      const searchAlpha =
        fadeStart === null
          ? 1
          : Math.max(0, 1 - (now - fadeStart) / SEARCH_FADE_MS)
      const { r: pr, g: pg, b: pb, a: pa } = parseRgba(palette.path)
      const wallColor = palette.fg

      // Pass 1: base grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * (cellW + gap)
          const y = r * (cellH + gap)
          const k = key(r, c)
          const isStart = r === start.r && c === start.c
          const isGoal = r === goal.r && c === goal.c
          const onPath = pathSet.has(k)

          if (onPath) {
            ctx.fillStyle = palette.muted
            ctx.globalAlpha = 0.2
            ctx.fillRect(x, y, cellW, cellH)
            ctx.globalAlpha = 1
            continue
          }

          if (grid[r]![c] === 1) {
            // Wall covers gap — border matches wall color
            ctx.globalAlpha = 0.85
            fillSeamless(ctx, x, y, cellW, cellH, gap, wallColor)
            ctx.globalAlpha = 1
          } else {
            ctx.fillStyle = palette.muted
            ctx.globalAlpha = 0.35
            ctx.fillRect(x, y, cellW, cellH)
            ctx.globalAlpha = 1
          }

          if (!isStart && !isGoal && searchAlpha > 0.01) {
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
        }
      }

      // Pass 2: animated path
      for (let i = 0; i < shownPath.length; i++) {
        const p = shownPath[i]!
        const x = p.c * (cellW + gap)
        const y = p.r * (cellH + gap)
        const idx = pathIndex.get(key(p.r, p.c)) ?? i

        let pulse = 0.55
        if (!reduced) {
          const phase =
            (now / PATH_PULSE_MS) * Math.PI * 2 - idx * PATH_WAVE_LAG
          pulse = 0.5 + 0.5 * Math.sin(phase)
        }

        // Soft glow (opacity only — no grow/scale)
        if (!reduced) {
          ctx.save()
          ctx.shadowColor = `rgba(${pr}, ${pg}, ${pb}, ${0.45 + 0.3 * pulse})`
          ctx.shadowBlur = cell * (0.28 + 0.35 * pulse)
          ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${0.12 + 0.18 * pulse})`
          const gpad = cell * 0.08
          ctx.fillRect(x - gpad, y - gpad, cellW + gpad * 2, cellH + gpad * 2)
          ctx.restore()
        }

        const fillA = pa * (0.82 + 0.18 * pulse)
        fillSeamless(
          ctx,
          x,
          y,
          cellW,
          cellH,
          gap,
          `rgba(${pr}, ${pg}, ${pb}, ${fillA})`,
        )

        // Inner sheen
        if (!reduced) {
          const pad = Math.min(cellW, cellH) * 0.2
          ctx.fillStyle = `rgba(${Math.min(255, pr + 40)}, ${Math.min(255, pg + 30)}, ${Math.min(255, pb + 30)}, ${0.08 + 0.14 * pulse})`
          ctx.fillRect(x + pad, y + pad, cellW - pad * 2, cellH - pad * 2)
        }
      }

      // Pass 3: markers
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const isStart = r === start.r && c === start.c
          const isGoal = r === goal.r && c === goal.c
          if (!isStart && !isGoal) continue
          const x = c * (cellW + gap)
          const y = r * (cellH + gap)
          const cx = x + cellW / 2
          const cy = y + cellH / 2

          if (isStart) {
            const rr = Math.min(cellW, cellH) * 0.3
            ctx.strokeStyle = ink
            ctx.fillStyle = ink
            ctx.lineWidth = Math.max(1, cell * 0.08)
            ctx.beginPath()
            ctx.arc(cx, cy, rr, 0, Math.PI * 2)
            ctx.stroke()

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
