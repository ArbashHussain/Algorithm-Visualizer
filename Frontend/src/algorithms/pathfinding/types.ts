export type CellKind = "empty" | "wall" | "weight" | "start" | "end"

export type CellOverlay = "none" | "visited" | "frontier" | "path" | "current"

/** Travel direction along a reconstructed path (start → end). */
export type PathDir = "up" | "down" | "left" | "right"

export type Coord = { r: number; c: number }

export type PathFrame = {
  /** Overlay for every cell as flat row-major list, or sparse keys "r,c" */
  visited: Set<string>
  frontier: Set<string>
  path: Set<string>
  current: string | null
  stats?: { pathLength: number; visitedCount: number }
  done?: boolean
  found?: boolean
  /**
   * Ordered path keys from start → end while the path is drawn / settled.
   * Used for directional arrows and the dash-settle animation.
   */
  pathOrder?: string[]
  /**
   * Path-reveal stage flag for the canvas:
   * - 0 (or unset during generation): trail pieces only, no terminal arrow
   * - > 0: path complete — draw permanent arrow on the cell immediately before end
   * Start/end never receive path glyphs.
   */
  pathSettled?: number
}

export type PathGenerator = Generator<PathFrame, PathFrame | void, unknown>

export type PathAlgorithmId =
  | "bfs"
  | "bi-bfs"
  | "dfs"
  | "dijkstra"
  | "astar"
  | "idastar"
  | "bi-astar"
  | "bellman-ford"

export type PathAlgorithmMeta = {
  id: PathAlgorithmId
  label: string
}

export function key(r: number, c: number): string {
  return `${r},${c}`
}

export function parseKey(k: string): Coord {
  const [r, c] = k.split(",").map(Number)
  return { r: r!, c: c! }
}
