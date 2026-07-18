import type { PathAlgorithmMeta } from "./types"
import { PATH_FNS } from "./searches"

export * from "./types"
export * from "./grid"
export * from "./maze"
export { PATH_FNS } from "./searches"

export const PATH_ALGORITHMS: PathAlgorithmMeta[] = [
  { id: "bfs", label: "BFS" },
  { id: "bi-bfs", label: "Bi-BFS" },
  { id: "dfs", label: "DFS" },
  { id: "dijkstra", label: "Dijkstra" },
  { id: "astar", label: "A*" },
  { id: "idastar", label: "IDA*" },
  { id: "bi-astar", label: "Bi-A*" },
  { id: "bellman-ford", label: "Bellman Ford" },
]

export function getPathFn(id: string) {
  return PATH_FNS[id]
}
