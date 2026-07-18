/**
 * Animated maze generators.
 * Step logic mirrors Backend/maze_gen_algos.py (DFS carve + random open).
 * Each yield is one visual frame so the UI can play generation in real time.
 */
import { clearWalls, cloneGrid, type GridModel } from "./grid"
import type { CellKind } from "./types"
import { key } from "./types"

export type MazeFrame = {
  grid: GridModel
  /** Current head cell (pygame looking_at), as "r,c" */
  head: string | null
  done?: boolean
}

export type MazeGenerator = Generator<MazeFrame, MazeFrame | void, unknown>

function stampStartEnd(g: GridModel): GridModel {
  const next = cloneGrid(g)
  for (let r = 0; r < next.rows; r++) {
    for (let c = 0; c < next.cols; c++) {
      const k = next.cells[r]![c]!
      if (k === "start" || k === "end") next.cells[r]![c] = "empty"
    }
  }
  next.cells[next.start.r]![next.start.c] = "start"
  next.cells[next.end.r]![next.end.c] = "end"
  return next
}

function fillWalls(g: GridModel): GridModel {
  const next = cloneGrid(g)
  for (let r = 0; r < next.rows; r++) {
    for (let c = 0; c < next.cols; c++) {
      next.cells[r]![c] = "wall"
    }
  }
  return next
}

/** pygame is_free: cell is allowed if it still has ≥3 barrier neighbors */
function isFree(cells: CellKind[][], r: number, c: number, rows: number, cols: number) {
  let count = 0
  if (c + 1 < cols && cells[r]![c + 1] === "wall") count++
  if (c - 1 >= 0 && cells[r]![c - 1] === "wall") count++
  if (r + 1 < rows && cells[r + 1]![c] === "wall") count++
  if (r - 1 >= 0 && cells[r - 1]![c] === "wall") count++
  return count >= 3
}

/** pygame unvisited_n */
function unvisitedNeighbors(
  cells: CellKind[][],
  r: number,
  c: number,
  rows: number,
  cols: number,
): [number, number][] {
  const n: [number, number][] = []
  const tryAdd = (nr: number, nc: number) => {
    if (
      nr >= 0 &&
      nc >= 0 &&
      nr < rows &&
      nc < cols &&
      cells[nr]![nc] === "wall" &&
      isFree(cells, nr, nc, rows, cols)
    ) {
      n.push([nr, nc])
    }
  }
  tryAdd(r, c + 1)
  tryAdd(r, c - 1)
  tryAdd(r + 1, c)
  tryAdd(r - 1, c)
  return n
}

/**
 * DFS growing-tree maze (animated).
 * Matches maze_gen_dfs: fill walls → carve with looking_at head → reset on backtrack.
 */
export function* generateDfsMazeSteps(base: GridModel): MazeGenerator {
  const { rows, cols } = base
  if (rows < 3 || cols < 3) {
    const g = stampStartEnd(clearWalls(base))
    yield { grid: g, head: null, done: true }
    return { grid: g, head: null, done: true }
  }

  let cells = fillWalls(base).cells.map((row) => row.slice() as CellKind[])
  let r = 1
  let c = 1
  // looking_at: mark as empty for walkability, head highlights separately
  cells[r]![c] = "empty"
  const stack: [number, number][] = [[r, c]]

  const snapshot = (headR: number, headC: number, done = false): MazeFrame => {
    const g = stampStartEnd({
      rows,
      cols,
      cells: cells.map((row) => row.slice() as CellKind[]),
      start: { ...base.start },
      end: { ...base.end },
    })
    return {
      grid: g,
      head: done ? null : key(headR, headC),
      done,
    }
  }

  yield snapshot(r, c)

  while (true) {
    const neighbors = unvisitedNeighbors(cells, r, c, rows, cols)
    if (neighbors.length > 0) {
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)]!
      r = nr
      c = nc
      cells[r]![c] = "empty" // looking_at → open cell
      stack.push([r, c])
      yield snapshot(r, c)
    } else {
      if (stack.length > 0) {
        const popped = stack.pop()!
        r = popped[0]
        c = popped[1]
        // pygame: reset() on backtrack (already empty; reaffirm)
        cells[r]![c] = "empty"
        yield snapshot(r, c)
      }
      if (stack.length > 0) {
        r = stack[stack.length - 1]![0]
        c = stack[stack.length - 1]![1]
      } else {
        break
      }
    }
  }

  // Soften start/end if still boxed in walls
  cells = stampStartEnd({
    rows,
    cols,
    cells,
    start: { ...base.start },
    end: { ...base.end },
  }).cells
  for (const p of [base.start, base.end]) {
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ] as const) {
      const rr = p.r + dr
      const cc = p.c + dc
      if (rr > 0 && cc > 0 && rr < rows - 1 && cc < cols - 1) {
        if (cells[rr]![cc] === "wall") cells[rr]![cc] = "empty"
      }
    }
  }
  const final = stampStartEnd({
    rows,
    cols,
    cells,
    start: { ...base.start },
    end: { ...base.end },
  })
  yield { grid: final, head: null, done: true }
  return { grid: final, head: null, done: true }
}

/** Instant helpers (e.g. tests) — drain the animated generators. */
export function generateDfsMaze(g: GridModel): GridModel {
  let last = stampStartEnd(clearWalls(g))
  for (const frame of generateDfsMazeSteps(g)) last = frame.grid
  return last
}