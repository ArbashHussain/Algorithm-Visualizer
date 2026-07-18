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
   * Ordered path keys from start → end while the path is revealed cell-by-cell.
   * Used to orient the start marker along the first step.
   */
  pathOrder?: string[]
  /**
   * Path-reveal stage flag:
   * - 0 (or unset during generation): still revealing path cells
   * - > 0: path reveal complete
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
  /** UI listed; step generator not wired yet */
  | "beam-search"
  | "greedy-best-first"

export type PathAlgorithmMeta = {
  id: PathAlgorithmId
  label: string
  /**
   * When false, shown in the UI but Play is disabled until implemented.
   * Default true for existing generators.
   */
  implemented?: boolean
}

export function key(r: number, c: number): string {
  return `${r},${c}`
}

export function parseKey(k: string): Coord {
  const [r, c] = k.split(",").map(Number)
  return { r: r!, c: c! }
}
