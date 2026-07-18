import { useEffect, useRef } from "react"
import type { AIFrame, GameTreeNode } from "@/algorithms/ai"
import { useVizTheme, type VizPalette } from "@/lib/viz-theme"

type Props = {
  frame: AIFrame | null
  className?: string
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

function withAlpha(color: string, a: number): string {
  const { r, g, b } = parseRgba(color)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`
}

/** Same red accent as pathfinding path. */
function accentRed(palette: VizPalette, dark: boolean): string {
  void palette
  return dark
    ? "rgba(239, 68, 68, 0.92)"
    : "rgba(220, 38, 38, 0.9)"
}

function isDark(): boolean {
  return document.documentElement.classList.contains("dark")
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function layoutTree(
  nodes: GameTreeNode[],
  rootId: string,
  w: number,
  h: number,
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()
  const byParent = new Map<string | null, GameTreeNode[]>()
  for (const n of nodes) {
    const list = byParent.get(n.parentId) ?? []
    list.push(n)
    byParent.set(n.parentId, list)
  }
  for (const [, list] of byParent) {
    list.sort((a, b) => a.order - b.order)
  }

  const maxDepth = Math.max(...nodes.map((n) => n.depth), 0)
  const padX = w * 0.06
  const padY = h * 0.1
  const usableW = w - padX * 2
  const usableH = h - padY * 2

  // Assign leaf x via in-order walk of structure
  let leafIndex = 0
  const leafCount = nodes.filter(
    (n) => !(byParent.get(n.id)?.length),
  ).length || 1

  function place(id: string) {
    const children = byParent.get(id) ?? []
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    if (!children.length) {
      const x = padX + ((leafIndex + 0.5) / leafCount) * usableW
      const y =
        padY +
        (maxDepth <= 0 ? usableH / 2 : (node.depth / maxDepth) * usableH)
      pos.set(id, { x, y })
      leafIndex++
      return
    }
    for (const c of children) place(c.id)
    const xs = children.map((c) => pos.get(c.id)!.x)
    const x = (Math.min(...xs) + Math.max(...xs)) / 2
    const y =
      padY +
      (maxDepth <= 0 ? usableH / 2 : (node.depth / maxDepth) * usableH)
    pos.set(id, { x, y })
  }

  place(rootId)
  // orphans
  for (const n of nodes) {
    if (!pos.has(n.id)) {
      pos.set(n.id, {
        x: padX + usableW / 2,
        y: padY + (n.depth / Math.max(1, maxDepth)) * usableH,
      })
    }
  }
  return pos
}

// ---------------------------------------------------------------------------
// Drawers
// ---------------------------------------------------------------------------

function drawGameTree(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "game-tree" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  if (!frame.nodes.length || !frame.rootId) {
    drawEmpty(ctx, w, h, palette, "Game tree — waiting for backend")
    return
  }
  const dark = isDark()
  const red = accentRed(palette, dark)
  const pos = layoutTree(frame.nodes, frame.rootId, w, h)
  const r = Math.max(10, Math.min(w, h) * 0.028)

  // Edges
  for (const n of frame.nodes) {
    if (!n.parentId) continue
    const a = pos.get(n.parentId)
    const b = pos.get(n.id)
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    if (n.state === "pruned") {
      ctx.strokeStyle = withAlpha(palette.muted, 0.35)
      ctx.setLineDash([4, 4])
    } else if (n.state === "best" || n.state === "current") {
      ctx.strokeStyle = withAlpha(palette.fg, 0.55)
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = withAlpha(palette.muted, 0.55)
      ctx.setLineDash([])
    }
    ctx.lineWidth = 1.25
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Nodes
  for (const n of frame.nodes) {
    const p = pos.get(n.id)
    if (!p) continue
    let fill = withAlpha(palette.muted, 0.35)
    let stroke = palette.fg
    let sw = 1.25

    switch (n.state) {
      case "current":
        fill = red
        stroke = red
        sw = 2
        break
      case "best":
        fill = withAlpha(palette.fg, 0.9)
        stroke = palette.fg
        sw = 2
        break
      case "evaluated":
        fill = withAlpha(palette.fg, 0.55)
        break
      case "exploring":
        fill = withAlpha(palette.fg, 0.28)
        break
      case "pruned":
        fill = withAlpha(palette.muted, 0.15)
        stroke = withAlpha(palette.muted, 0.5)
        break
      default:
        break
    }

    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = sw
    ctx.stroke()

    // Label
    const label =
      n.value != null && n.state !== "idle"
        ? String(n.value)
        : n.detail
          ? n.detail.split("·")[0]!.trim()
          : n.role === "max"
            ? "▲"
            : n.role === "min"
              ? "▼"
              : ""
    if (label) {
      ctx.fillStyle =
        n.state === "current" || n.state === "best"
          ? dark
            ? "rgba(20,20,20,0.95)"
            : "rgba(255,255,255,0.95)"
          : palette.fg
      if (n.state === "current") ctx.fillStyle = "rgba(255,255,255,0.95)"
      if (n.state === "best") {
        ctx.fillStyle = dark ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.95)"
      }
      ctx.font = `${Math.max(9, r * 0.85)}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(label.slice(0, 6), p.x, p.y)
    }
  }
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "board" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const n = frame.size
  const pad = Math.min(w, h) * 0.06
  const size = Math.min(w, h) - pad * 2
  const ox = (w - size) / 2
  const oy = (h - size) / 2
  const cell = size / n
  const gap = Math.max(1, cell * 0.04)

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = ox + c * cell + gap / 2
      const y = oy + r * cell + gap / 2
      const s = cell - gap
      const v = frame.board[r]?.[c] ?? 0
      const isCursor =
        frame.cursor?.r === r && frame.cursor?.c === c
      const isHi = frame.highlight?.some((p) => p.r === r && p.c === c)

      // checker for nqueens / neutral board
      const checker = (r + c) % 2 === 0
      ctx.fillStyle = checker
        ? withAlpha(palette.fg, 0.08)
        : withAlpha(palette.fg, 0.04)
      if (isHi) ctx.fillStyle = withAlpha(red, 0.25)
      ctx.fillRect(x, y, s, s)

      if (isCursor) {
        ctx.strokeStyle = red
        ctx.lineWidth = 2
        ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      }

      if (frame.mode === "sudoku") {
        // light 3×3 block lines
        if (r % 3 === 0 && r > 0) {
          ctx.strokeStyle = withAlpha(palette.fg, 0.35)
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(ox, y - gap / 2)
          ctx.lineTo(ox + size, y - gap / 2)
          ctx.stroke()
        }
        if (c % 3 === 0 && c > 0) {
          ctx.strokeStyle = withAlpha(palette.fg, 0.35)
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x - gap / 2, oy)
          ctx.lineTo(x - gap / 2, oy + size)
          ctx.stroke()
        }
        if (v >= 1 && v <= 9) {
          ctx.fillStyle = palette.fg
          ctx.font = `${Math.max(10, s * 0.45)}px ui-sans-serif, system-ui, sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(String(v), x + s / 2, y + s / 2)
        }
      } else if (v === 1) {
        // queen / X
        if (frame.mode === "nqueens") {
          ctx.fillStyle = palette.fg
          ctx.beginPath()
          ctx.arc(x + s / 2, y + s / 2, s * 0.22, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = palette.fg
          ctx.lineWidth = Math.max(1.2, s * 0.06)
          ctx.beginPath()
          ctx.arc(x + s / 2, y + s / 2, s * 0.32, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.strokeStyle = palette.fg
          ctx.lineWidth = Math.max(2, s * 0.08)
          ctx.beginPath()
          ctx.moveTo(x + s * 0.25, y + s * 0.25)
          ctx.lineTo(x + s * 0.75, y + s * 0.75)
          ctx.moveTo(x + s * 0.75, y + s * 0.25)
          ctx.lineTo(x + s * 0.25, y + s * 0.75)
          ctx.stroke()
        }
      } else if (v === 2) {
        if (frame.mode === "tic-tac-toe") {
          ctx.strokeStyle = red
          ctx.lineWidth = Math.max(2, s * 0.08)
          ctx.beginPath()
          ctx.arc(x + s / 2, y + s / 2, s * 0.28, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.fillStyle = withAlpha(red, 0.2)
          ctx.fillRect(x, y, s, s)
        }
      }
    }
  }
}

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "landscape" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const heights = frame.heights
  const n = heights.length
  if (!n) return

  const padX = w * 0.06
  const padY = h * 0.12
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const gap = n > 40 ? 1 : 2
  const barW = Math.max(2, (usableW - gap * (n - 1)) / n)
  const visited = new Set(frame.visited ?? [])

  for (let i = 0; i < n; i++) {
    const bh = Math.max(2, heights[i]! * usableH)
    const x = padX + i * (barW + gap)
    const y = padY + usableH - bh

    let fill = withAlpha(palette.fg, 0.22)
    if (visited.has(i)) fill = withAlpha(palette.fg, 0.45)
    if (frame.best >= 0 && i === frame.best) fill = withAlpha(palette.fg, 0.85)
    if (frame.candidate != null && i === frame.candidate)
      fill = withAlpha(red, 0.55)
    if (frame.current >= 0 && i === frame.current) fill = red

    ctx.fillStyle = fill
    ctx.fillRect(x, y, barW, bh)
  }

  // baseline
  ctx.strokeStyle = withAlpha(palette.muted, 0.5)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padX, padY + usableH + 0.5)
  ctx.lineTo(padX + usableW, padY + usableH + 0.5)
  ctx.stroke()

  // temperature badge
  if (frame.temperature != null) {
    ctx.fillStyle = palette.fg
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.globalAlpha = 0.7
    ctx.fillText(`T = ${frame.temperature.toFixed(2)}`, padX, 8)
    ctx.globalAlpha = 1
  }
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "points" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const pad = Math.min(w, h) * 0.08
  const toX = (x: number) => pad + x * (w - pad * 2)
  const toY = (y: number) => pad + y * (h - pad * 2)

  // field heatmap
  if (frame.field) {
    const { cols, rows, values } = frame.field
    const cw = (w - pad * 2) / cols
    const ch = (h - pad * 2) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = values[r * cols + c] ?? 0
        ctx.fillStyle = withAlpha(palette.fg, 0.04 + v * 0.22)
        ctx.fillRect(pad + c * cw, pad + r * ch, cw + 0.5, ch + 0.5)
      }
    }
  }

  const hasData =
    frame.points.length > 0 ||
    (frame.particles?.length ?? 0) > 0 ||
    (frame.trail?.length ?? 0) > 0 ||
    (frame.centroids?.length ?? 0) > 0 ||
    !!frame.field

  if (!hasData) {
    drawEmpty(ctx, w, h, palette, "Points view — waiting for backend")
    return
  }

  // trail
  if (frame.trail && frame.trail.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = withAlpha(red, 0.55)
    ctx.lineWidth = 1.5
    frame.trail.forEach((p, i) => {
      const x = toX(p.x)
      const y = toY(p.y)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  // decision boundary / regression fit
  if (frame.line && frame.line.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = withAlpha(red, 0.85)
    ctx.lineWidth = 2
    frame.line.forEach((p, i) => {
      const x = toX(p.x)
      const y = toY(p.y)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  // cluster color: use grayscale steps + red for active
  const clusterTone = (k: number) => {
    const tones = [0.35, 0.55, 0.75, 0.45, 0.65]
    return withAlpha(palette.fg, tones[k % tones.length] ?? 0.5)
  }

  for (const p of frame.points) {
    const x = toX(p.x)
    const y = toY(p.y)
    const rad = Math.max(3, Math.min(w, h) * 0.012)
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fillStyle = p.active
      ? red
      : p.cluster != null
        ? clusterTone(p.cluster)
        : withAlpha(palette.fg, 0.5)
    ctx.fill()
  }

  // particles (PSO)
  if (frame.particles) {
    for (const p of frame.particles) {
      const x = toX(p.x)
      const y = toY(p.y)
      const rad = Math.max(3.5, Math.min(w, h) * 0.014)
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fillStyle = withAlpha(palette.fg, 0.7)
      ctx.fill()
      ctx.strokeStyle = palette.fg
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // centroids / global best
  if (frame.centroids) {
    for (const c of frame.centroids) {
      const x = toX(c.x)
      const y = toY(c.y)
      const rad = Math.max(5, Math.min(w, h) * 0.018)
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fillStyle = red
      ctx.fill()
      ctx.strokeStyle = red
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, rad + 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function drawNetwork(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "network" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const layers = frame.layers
  const padX = w * 0.08
  const padY = h * 0.12
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const L = layers.length

  type N = { x: number; y: number; layer: number; i: number }
  const nodes: N[] = []
  const byLayer: N[][] = []

  for (let li = 0; li < L; li++) {
    const count = layers[li]!
    const x =
      padX + (L <= 1 ? usableW / 2 : (li / (L - 1)) * usableW)
    const layerNodes: N[] = []
    for (let i = 0; i < count; i++) {
      const y =
        count <= 1
          ? padY + usableH / 2
          : padY + (i / (count - 1)) * usableH
      const node = { x, y, layer: li, i }
      layerNodes.push(node)
      nodes.push(node)
    }
    byLayer.push(layerNodes)
  }

  // edges
  for (let li = 0; li < L - 1; li++) {
    for (const a of byLayer[li]!) {
      for (const b of byLayer[li + 1]!) {
        const active =
          frame.activeLayer === li ||
          frame.activeLayer === li + 1 ||
          (frame.backward && frame.activeLayer === li)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = active
          ? withAlpha(frame.backward ? red : palette.fg, 0.35)
          : withAlpha(palette.muted, 0.4)
        ctx.lineWidth = active ? 1.25 : 1
        ctx.stroke()
      }
    }
  }

  const r = Math.max(5, Math.min(w, h) * 0.028)
  for (const n of nodes) {
    const act = frame.activations[n.layer]?.[n.i] ?? 0.2
    const isActive = frame.activeLayer === n.layer
    ctx.beginPath()
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
    if (isActive) {
      ctx.fillStyle = frame.backward ? red : withAlpha(palette.fg, 0.5 + act * 0.5)
    } else {
      ctx.fillStyle = withAlpha(palette.fg, 0.2 + act * 0.55)
    }
    ctx.fill()
    ctx.strokeStyle = isActive ? (frame.backward ? red : palette.fg) : withAlpha(palette.muted, 0.6)
    ctx.lineWidth = isActive ? 2 : 1
    ctx.stroke()
  }
}

function drawGridAgent(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "grid-agent" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const { rows, cols, cells, agent } = frame
  const gap = 1
  const cell = Math.floor(
    Math.min(
      (w - gap * (cols - 1)) / cols,
      (h - gap * (rows - 1)) / rows,
    ),
  )
  if (cell <= 0) return
  const gridW = cell * cols + gap * (cols - 1)
  const gridH = cell * rows + gap * (rows - 1)
  const ox = (w - gridW) / 2
  const oy = (h - gridH) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * (cell + gap)
      const y = oy + r * (cell + gap)
      const kind = cells[r]![c]!
      const heat = frame.qHeat?.[r]?.[c] ?? 0

      if (kind === 1) {
        // wall — seamless like pathfinding
        const pad = gap / 2
        ctx.fillStyle = palette.wall
        ctx.fillRect(x - pad, y - pad, cell + gap, cell + gap)
      } else {
        ctx.fillStyle = withAlpha(palette.fg, 0.06 + heat * 0.45)
        ctx.fillRect(x, y, cell, cell)
      }

      if (kind === 2) {
        // goal
        ctx.strokeStyle = red
        ctx.lineWidth = Math.max(1.5, cell * 0.1)
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.28, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = red
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // path trail
  if (frame.path && frame.path.length > 1) {
    ctx.strokeStyle = withAlpha(red, 0.4)
    ctx.lineWidth = Math.max(1, cell * 0.12)
    ctx.lineJoin = "round"
    ctx.beginPath()
    frame.path.forEach((p, i) => {
      const x = ox + p.c * (cell + gap) + cell / 2
      const y = oy + p.r * (cell + gap) + cell / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  // agent (skip if unset — idle shell)
  if (
    agent.r >= 0 &&
    agent.c >= 0 &&
    agent.r < rows &&
    agent.c < cols
  ) {
    const ax = ox + agent.c * (cell + gap) + cell / 2
    const ay = oy + agent.r * (cell + gap) + cell / 2
    ctx.fillStyle = palette.fg
    ctx.beginPath()
    ctx.arc(ax, ay, cell * 0.28, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPopulation(
  ctx: CanvasRenderingContext2D,
  frame: Extract<AIFrame, { kind: "population" }>,
  w: number,
  h: number,
  palette: VizPalette,
) {
  const dark = isDark()
  const red = accentRed(palette, dark)
  const inds = frame.individuals
  const n = inds.length
  if (!n) return

  const padX = w * 0.06
  const padY = h * 0.14
  const usableW = w - padX * 2
  const usableH = h - padY * 2
  const gap = n > 24 ? 1 : 2
  const barW = Math.max(3, (usableW - gap * (n - 1)) / n)
  const maxF = Math.max(...inds.map((i) => i.fitness), 1e-6)

  for (let i = 0; i < n; i++) {
    const ind = inds[i]!
    const bh = Math.max(2, (ind.fitness / maxF) * usableH)
    const x = padX + i * (barW + gap)
    const y = padY + usableH - bh

    let fill = withAlpha(palette.fg, 0.4)
    if (ind.selected) fill = withAlpha(palette.fg, 0.7)
    if (ind.mutated) fill = withAlpha(red, 0.55)
    if (ind.elite) fill = red

    ctx.fillStyle = fill
    ctx.fillRect(x, y, barW, bh)
  }

  ctx.fillStyle = withAlpha(palette.fg, 0.7)
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(
    `gen ${frame.generation}  ·  best ${frame.bestFitness.toFixed(3)}  ·  avg ${frame.avgFitness.toFixed(3)}`,
    padX,
    8,
  )
}

function drawEmpty(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: VizPalette,
  msg: string,
) {
  ctx.fillStyle = withAlpha(palette.fg, 0.45)
  ctx.font = "14px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(msg, w / 2, h / 2)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AICanvas({ frame, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const palette = useVizTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const paint = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h)
      if (w < 2 || h < 2) return
      if (!frame) {
        drawEmpty(ctx, w, h, palette, "Select an algorithm and press Play")
        return
      }

      switch (frame.kind) {
        case "game-tree":
          drawGameTree(ctx, frame, w, h, palette)
          break
        case "board":
          drawBoard(ctx, frame, w, h, palette)
          break
        case "landscape":
          drawLandscape(ctx, frame, w, h, palette)
          break
        case "points":
          drawPoints(ctx, frame, w, h, palette)
          break
        case "network":
          drawNetwork(ctx, frame, w, h, palette)
          break
        case "grid-agent":
          drawGridAgent(ctx, frame, w, h, palette)
          break
        case "population":
          drawPopulation(ctx, frame, w, h, palette)
          break
      }
    }

    const resize = () => {
      // Size from the wrapper (CSS box), never from canvas bitmap attributes —
      // observing the canvas itself can create an infinite height feedback loop.
      const { width, height } = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = Math.max(1, Math.floor(width))
      const cssH = Math.max(1, Math.floor(height))
      canvas.width = Math.max(1, Math.floor(cssW * dpr))
      canvas.height = Math.max(1, Math.floor(cssH * dpr))
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint(cssW, cssH)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [frame, palette])

  return (
    <div ref={wrapRef} className={className ?? "h-full w-full"}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label="AI algorithm visualization"
      />
    </div>
  )
}
