import type { CellKind, Coord } from "./types"
import { key } from "./types"

export type GridModel = {
  rows: number
  cols: number
  cells: CellKind[][]
  start: Coord
  end: Coord
}

export function createEmptyGrid(rows: number, cols: number): GridModel {
  const cells: CellKind[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "empty" as CellKind),
  )
  const start = { r: Math.floor(rows / 2), c: Math.floor(cols * 0.15) }
  const end = { r: Math.floor(rows / 2), c: Math.floor(cols * 0.85) }
  cells[start.r]![start.c] = "start"
  cells[end.r]![end.c] = "end"
  return { rows, cols, cells, start, end }
}

export function cloneGrid(g: GridModel): GridModel {
  return {
    rows: g.rows,
    cols: g.cols,
    cells: g.cells.map((row) => row.slice() as CellKind[]),
    start: { ...g.start },
    end: { ...g.end },
  }
}

export function clearSearchOverlays(g: GridModel): GridModel {
  // Base grid only stores structural kinds; overlays live in frames.
  return cloneGrid(g)
}

export function setCell(
  g: GridModel,
  r: number,
  c: number,
  kind: CellKind,
): GridModel {
  if (r < 0 || c < 0 || r >= g.rows || c >= g.cols) return g
  const next = cloneGrid(g)
  const prev = next.cells[r]![c]!

  if (kind === "start") {
    next.cells[next.start.r]![next.start.c] = "empty"
    next.start = { r, c }
    next.cells[r]![c] = "start"
    return next
  }
  if (kind === "end") {
    next.cells[next.end.r]![next.end.c] = "empty"
    next.end = { r, c }
    next.cells[r]![c] = "end"
    return next
  }
  if (prev === "start" || prev === "end") return g
  next.cells[r]![c] = kind
  return next
}

export function clearWalls(g: GridModel): GridModel {
  const next = cloneGrid(g)
  for (let r = 0; r < next.rows; r++) {
    for (let c = 0; c < next.cols; c++) {
      const k = next.cells[r]![c]!
      if (k === "wall" || k === "weight") next.cells[r]![c] = "empty"
    }
  }
  next.cells[next.start.r]![next.start.c] = "start"
  next.cells[next.end.r]![next.end.c] = "end"
  return next
}

export function isWalkable(g: GridModel, r: number, c: number): boolean {
  if (r < 0 || c < 0 || r >= g.rows || c >= g.cols) return false
  return g.cells[r]![c] !== "wall"
}

export function isWeight(g: GridModel, r: number, c: number): boolean {
  return g.cells[r]![c] === "weight"
}

export function costAt(g: GridModel, r: number, c: number): number {
  return isWeight(g, r, c) ? 5 : 1
}

const DIRS: Coord[] = [
  { r: 1, c: 0 },
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 0, c: -1 },
]

export function neighbors(g: GridModel, r: number, c: number): Coord[] {
  const out: Coord[] = []
  for (const d of DIRS) {
    const nr = r + d.r
    const nc = c + d.c
    if (isWalkable(g, nr, nc)) out.push({ r: nr, c: nc })
  }
  return out
}

export function hScore(a: Coord, b: Coord): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

export function reconstructPath(
  cameFrom: Map<string, string>,
  startK: string,
  endK: string,
): string[] {
  const path: string[] = []
  let cur: string | undefined = endK
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    path.push(cur)
    if (cur === startK) break
    cur = cameFrom.get(cur)
  }
  path.reverse()
  if (path[0] !== startK) return []
  return path
}

export function frameBase(
  visited: Set<string>,
  frontier: Set<string>,
  path: Set<string>,
  current: string | null,
  extra?: Partial<{
    pathLength: number
    visitedCount: number
    done: boolean
    found: boolean
    pathOrder: string[]
    pathSettled: number
  }>,
) {
  return {
    visited: new Set(visited),
    frontier: new Set(frontier),
    path: new Set(path),
    current,
    stats:
      extra?.pathLength !== undefined
        ? {
            pathLength: extra.pathLength,
            visitedCount: extra.visitedCount ?? visited.size,
          }
        : undefined,
    done: extra?.done,
    found: extra?.found,
    pathOrder: extra?.pathOrder ? [...extra.pathOrder] : undefined,
    pathSettled: extra?.pathSettled,
  }
}

export { key }
