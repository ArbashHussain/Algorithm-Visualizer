import { useEffect, useRef } from "react"
import { prefersReducedMotion, usePreviewTheme } from "./usePreviewTheme"

const COLS = 11
const ROWS = 7
const STEP_MS = 55
const HOLD_MS = 900

type Cell = 0 | 1 // 0 empty, 1 wall

function buildMaze(): Cell[][] {
  const g: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0 as Cell),
  )
  // A few walls so BFS has a path to find
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

/** Mini BFS on a grid: expand, then paint the path, loop. */
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
    let orderIdx = 0
    let phase: Phase = "search"
    let last = performance.now()
    let holdUntil = 0
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
      orderIdx = 0
      phase = "search"
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
        phase = "hold"
        holdUntil = performance.now() + HOLD_MS
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, w, h)

      const gap = 2
      const cellW = (w - gap * (COLS - 1)) / COLS
      const cellH = (h - gap * (ROWS - 1)) / ROWS

      const visitedSet = new Set(
        order.slice(0, orderIdx).map((c) => key(c.r, c.c)),
      )
      const pathSet = new Set(
        path.slice(0, pathIdx + 1).map((c) => key(c.r, c.c)),
      )

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * (cellW + gap)
          const y = r * (cellH + gap)
          const k = key(r, c)

          if (grid[r]![c] === 1) {
            ctx.fillStyle = palette.fg
            ctx.globalAlpha = 0.85
          } else if (pathSet.has(k)) {
            ctx.fillStyle = palette.fg
            ctx.globalAlpha = 1
          } else if (frontier && frontier.r === r && frontier.c === c) {
            ctx.fillStyle = palette.fg
            ctx.globalAlpha = 0.75
          } else if (visitedSet.has(k)) {
            ctx.fillStyle = palette.accent
            ctx.globalAlpha = 0.55
          } else {
            ctx.fillStyle = palette.muted
            ctx.globalAlpha = 0.5
          }

          // Start / goal slightly stronger empty markers
          if (
            (r === start.r && c === start.c) ||
            (r === goal.r && c === goal.c)
          ) {
            if (!pathSet.has(k)) {
              ctx.fillStyle = palette.fg
              ctx.globalAlpha = 0.9
            }
          }

          ctx.fillRect(x, y, cellW, cellH)
          ctx.globalAlpha = 1
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
        // Static final-ish frame for reduced motion
        while (phase === "search") stepSearch()
        pathIdx = path.length
        phase = "hold"
        holdUntil = Infinity
      }
      draw()
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
