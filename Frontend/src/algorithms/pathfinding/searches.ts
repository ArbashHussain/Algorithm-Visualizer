/**
 * Pathfinding step generators.
 * Search logic mirrors Backend/maze_search_algos.py behavior
 * (BFS, DFS, Dijkstra, A-star, IDA-star, Bi-BFS, Bi-A-star, Bellman-Ford)
 * without Pygame or sound.
 */
import {
  costAt,
  frameBase,
  hScore,
  key,
  neighbors,
  reconstructPath,
  type GridModel,
} from "./grid"
import type { PathGenerator } from "./types"

function pathStats(path: string[], visitedCount: number) {
  // Path length excludes start (matches reconstruct_path c-1 style approx)
  const pathLength = Math.max(0, path.length - 1)
  return { pathLength, visitedCount }
}

function* paintPath(
  visited: Set<string>,
  frontier: Set<string>,
  pathKeys: string[],
  visCount: number,
): PathGenerator {
  const path = new Set<string>()
  const pathOrder: string[] = []

  // Reveal path start → end as trail pieces only (no arrows while generating).
  // pathSettled stays 0 during reveal; terminal arrow appears on the final frame.
  for (const p of pathKeys) {
    path.add(p)
    pathOrder.push(p)
    yield frameBase(visited, frontier, path, p, {
      ...pathStats([...path], visCount),
      done: false,
      found: true,
      pathOrder,
      pathSettled: 0,
    })
  }

  // Complete: permanent arrow on the cell immediately before end
  // (pathSettled > 0 signals canvas to draw that terminal arrow).
  yield frameBase(visited, frontier, path, null, {
    ...pathStats(pathKeys, visCount),
    done: true,
    found: true,
    pathOrder,
    pathSettled: 1,
  })
}

export function* bfs(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const queue: string[] = [startK]
  const visited = new Set<string>([startK])
  const cameFrom = new Map<string, string>()
  const frontier = new Set<string>([startK])
  let vis = 0

  while (queue.length) {
    const cur = queue.shift()!
    frontier.delete(cur)
    const [cr, cc] = cur.split(",").map(Number) as [number, number]

    if (cur === endK) {
      const path = reconstructPath(cameFrom, startK, endK)
      yield* paintPath(visited, frontier, path, vis)
      return
    }

    for (const n of neighbors(grid, cr, cc)) {
      const nk = key(n.r, n.c)
      if (visited.has(nk)) continue
      cameFrom.set(nk, cur)
      if (nk === endK) {
        visited.add(nk)
        const path = reconstructPath(cameFrom, startK, endK)
        yield* paintPath(visited, frontier, path, vis)
        return
      }
      queue.push(nk)
      visited.add(nk)
      frontier.add(nk)
    }

    if (cur !== startK) {
      vis += costAt(grid, cr, cc)
    }

    yield frameBase(visited, frontier, new Set(), cur, {
      visitedCount: vis,
      pathLength: 0,
    })
  }

  yield frameBase(visited, frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: vis,
  })
}

export function* dfs(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const stack: string[] = [startK]
  const visited = new Set<string>([startK])
  const cameFrom = new Map<string, string>()
  const onPath = new Set<string>([startK])
  const frontier = new Set<string>([startK])
  let vis = 0

  while (stack.length) {
    const cur = stack.pop()!
    frontier.delete(cur)
    onPath.add(cur)
    const [cr, cc] = cur.split(",").map(Number) as [number, number]

    if (cur === endK) {
      const path = reconstructPath(cameFrom, startK, endK)
      yield* paintPath(visited, frontier, path, vis)
      return
    }

    for (const n of neighbors(grid, cr, cc)) {
      const nk = key(n.r, n.c)
      if (visited.has(nk) || onPath.has(nk)) continue
      cameFrom.set(nk, cur)
      stack.push(nk)
      visited.add(nk)
      frontier.add(nk)
      if (nk === endK) {
        const path = reconstructPath(cameFrom, startK, endK)
        yield* paintPath(visited, frontier, path, vis)
        return
      }
    }

    if (cur !== startK) {
      vis += costAt(grid, cr, cc)
    }

    yield frameBase(visited, frontier, new Set(), cur, {
      visitedCount: vis,
      pathLength: 0,
    })
  }

  yield frameBase(visited, frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: vis,
  })
}

export function* dijkstra(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const dist = new Map<string, number>()
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>()
  const frontier = new Set<string>([startK])
  dist.set(startK, 0)

  type QItem = { d: number; k: string }
  const pq: QItem[] = [{ d: 0, k: startK }]
  const push = (item: QItem) => {
    pq.push(item)
    pq.sort((a, b) => a.d - b.d)
  }

  while (pq.length) {
    const { k: cur } = pq.shift()!
    if (visited.has(cur)) continue
    visited.add(cur)
    frontier.delete(cur)
    const [cr, cc] = cur.split(",").map(Number) as [number, number]

    if (cur === endK) {
      const path = reconstructPath(cameFrom, startK, endK)
      yield* paintPath(visited, frontier, path, visited.size)
      return
    }

    for (const n of neighbors(grid, cr, cc)) {
      const nk = key(n.r, n.c)
      const nd = (dist.get(cur) ?? Infinity) + costAt(grid, n.r, n.c)
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd)
        cameFrom.set(nk, cur)
        push({ d: nd, k: nk })
        frontier.add(nk)
      }
    }

    yield frameBase(visited, frontier, new Set(), cur, {
      visitedCount: visited.size,
      pathLength: 0,
    })
  }

  yield frameBase(visited, frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: visited.size,
  })
}

export function* astar(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const gScore = new Map<string, number>([[startK, 0]])
  const fScore = new Map<string, number>([
    [startK, hScore(grid.start, grid.end)],
  ])
  const cameFrom = new Map<string, string>()
  const open = new Set<string>([startK])
  const visited = new Set<string>()
  const frontier = new Set<string>([startK])
  let count = 0
  let vis = 0

  type QItem = { f: number; c: number; k: string }
  const pq: QItem[] = [{ f: fScore.get(startK)!, c: 0, k: startK }]
  const push = (item: QItem) => {
    pq.push(item)
    pq.sort((a, b) => a.f - b.f || a.c - b.c)
  }

  while (pq.length) {
    const { k: cur } = pq.shift()!
    if (!open.has(cur)) continue
    open.delete(cur)
    frontier.delete(cur)
    const [cr, cc] = cur.split(",").map(Number) as [number, number]

    if (cur === endK) {
      const path = reconstructPath(cameFrom, startK, endK)
      yield* paintPath(visited, frontier, path, vis)
      return
    }

    for (const n of neighbors(grid, cr, cc)) {
      const nk = key(n.r, n.c)
      const tempG = (gScore.get(cur) ?? Infinity) + costAt(grid, n.r, n.c)
      if (tempG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, cur)
        gScore.set(nk, tempG)
        const f = tempG + hScore(n, grid.end)
        fScore.set(nk, f)
        if (!open.has(nk)) {
          count += 1
          push({ f, c: count, k: nk })
          open.add(nk)
          frontier.add(nk)
        }
      }
    }

    if (cur !== startK) {
      vis += costAt(grid, cr, cc)
      visited.add(cur)
    }

    yield frameBase(visited, frontier, new Set(), cur, {
      visitedCount: vis,
      pathLength: 0,
    })
  }

  yield frameBase(visited, frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: vis,
  })
}

export function* idastar(grid: GridModel): PathGenerator {
  // Threshold-based iterative deepening of A* (mirrors maze_idastar structure)
  let threshold = 100
  const maxThreshold = grid.rows * grid.cols * 10
  let lastVisitedSize = -1

  while (threshold < maxThreshold) {
    const startK = key(grid.start.r, grid.start.c)
    const endK = key(grid.end.r, grid.end.c)
    const gScore = new Map<string, number>([[startK, 0]])
    const fScore = new Map<string, number>([
      [startK, hScore(grid.start, grid.end)],
    ])
    const cameFrom = new Map<string, string>()
    const visited = new Set<string>()
    const frontier = new Set<string>([startK])
    let count = 0
    let vis = 0

    type QItem = { f: number; c: number; k: string }
    const pq: QItem[] = [{ f: fScore.get(startK)!, c: 0, k: startK }]
    const push = (item: QItem) => {
      pq.push(item)
      pq.sort((a, b) => a.f - b.f || a.c - b.c)
    }

    while (pq.length) {
      const { k: cur } = pq.shift()!
      const [cr, cc] = cur.split(",").map(Number) as [number, number]
      frontier.delete(cur)

      if (cur === endK) {
        const path = reconstructPath(cameFrom, startK, endK)
        yield* paintPath(visited, frontier, path, vis)
        return
      }

      const fCur = fScore.get(cur) ?? Infinity
      if (fCur <= threshold) {
        for (const n of neighbors(grid, cr, cc)) {
          const nk = key(n.r, n.c)
          const tempG = (gScore.get(cur) ?? Infinity) + costAt(grid, n.r, n.c)
          const tempF = tempG + hScore(n, grid.end)
          if (tempF < (fScore.get(nk) ?? Infinity)) {
            cameFrom.set(nk, cur)
            gScore.set(nk, tempG)
            fScore.set(nk, tempF)
            count += 1
            push({ f: tempF, c: count, k: nk })
            frontier.add(nk)
          }
        }
      }

      if (cur !== startK) {
        visited.add(cur)
        vis += costAt(grid, cr, cc)
      }

      yield frameBase(visited, frontier, new Set(), cur, {
        visitedCount: vis,
        pathLength: 0,
      })
    }

    if (visited.size === lastVisitedSize) {
      yield frameBase(visited, frontier, new Set(), null, {
        done: true,
        found: false,
        pathLength: 0,
        visitedCount: vis,
      })
      return
    }
    lastVisitedSize = visited.size
    threshold += 10
  }

  yield frameBase(new Set(), new Set(), new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: 0,
  })
}

export function* biBfs(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const q1 = [startK]
  const q2 = [endK]
  const visited1 = new Set<string>([startK])
  const visited2 = new Set<string>([endK])
  const came1 = new Map<string, string>()
  const came2 = new Map<string, string>()
  const frontier = new Set<string>([startK, endK])
  let vis = 0

  const mergePath = (meet: string) => {
    const p1 = reconstructPath(came1, startK, meet)
    const p2 = reconstructPath(came2, endK, meet)
    p2.reverse()
    // meet appears in both; drop duplicate
    const full = [...p1, ...p2.slice(1)]
    return full
  }

  while (q1.length && q2.length) {
    const c1 = q1.shift()!
    const c2 = q2.shift()!
    frontier.delete(c1)
    frontier.delete(c2)
    const visited = new Set([...visited1, ...visited2])

    if (visited2.has(c1)) {
      const path = mergePath(c1)
      yield* paintPath(visited, frontier, path, vis)
      return
    }
    if (visited1.has(c2)) {
      const path = mergePath(c2)
      yield* paintPath(visited, frontier, path, vis)
      return
    }

    const [r1, col1] = c1.split(",").map(Number) as [number, number]
    for (const n of neighbors(grid, r1, col1)) {
      const nk = key(n.r, n.c)
      if (!visited1.has(nk)) {
        came1.set(nk, c1)
        q1.push(nk)
        visited1.add(nk)
        frontier.add(nk)
      }
    }

    const [r2, col2] = c2.split(",").map(Number) as [number, number]
    for (const n of neighbors(grid, r2, col2)) {
      const nk = key(n.r, n.c)
      if (!visited2.has(nk)) {
        came2.set(nk, c2)
        q2.push(nk)
        visited2.add(nk)
        frontier.add(nk)
      }
    }

    if (c1 !== startK) vis += 1
    if (c2 !== endK) vis += 1

    yield frameBase(new Set([...visited1, ...visited2]), frontier, new Set(), c1, {
      visitedCount: vis,
      pathLength: 0,
    })
  }

  yield frameBase(new Set([...visited1, ...visited2]), frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: vis,
  })
}

export function* biAstar(grid: GridModel): PathGenerator {
  // Bidirectional A* simplified: expand both fronts with f-score ordering
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)

  const gS = new Map<string, number>([[startK, 0]])
  const gE = new Map<string, number>([[endK, 0]])
  const cameS = new Map<string, string>()
  const cameE = new Map<string, string>()
  const openS = new Set<string>([startK])
  const openE = new Set<string>([endK])
  const visS = new Set<string>()
  const visE = new Set<string>()
  const frontier = new Set<string>([startK, endK])
  let vis = 0
  let count = 0

  type QItem = { f: number; c: number; k: string }
  const pqS: QItem[] = [{ f: hScore(grid.start, grid.end), c: 0, k: startK }]
  const pqE: QItem[] = [{ f: hScore(grid.start, grid.end), c: 0, k: endK }]
  const push = (pq: QItem[], item: QItem) => {
    pq.push(item)
    pq.sort((a, b) => a.f - b.f || a.c - b.c)
  }

  const merge = (meet: string) => {
    const p1 = reconstructPath(cameS, startK, meet)
    const p2 = reconstructPath(cameE, endK, meet)
    p2.reverse()
    return [...p1, ...p2.slice(1)]
  }

  while (pqS.length && pqE.length) {
    // Expand start side
    const curS = pqS.shift()!.k
    if (!openS.has(curS)) continue
    openS.delete(curS)
    frontier.delete(curS)
    visS.add(curS)
    const [sr, sc] = curS.split(",").map(Number) as [number, number]

    if (visE.has(curS) || openE.has(curS)) {
      const path = merge(curS)
      yield* paintPath(new Set([...visS, ...visE]), frontier, path, vis)
      return
    }

    for (const n of neighbors(grid, sr, sc)) {
      const nk = key(n.r, n.c)
      const tg = (gS.get(curS) ?? Infinity) + costAt(grid, n.r, n.c)
      if (tg < (gS.get(nk) ?? Infinity)) {
        cameS.set(nk, curS)
        gS.set(nk, tg)
        const f = tg + hScore(n, grid.end)
        if (!openS.has(nk)) {
          count += 1
          push(pqS, { f, c: count, k: nk })
          openS.add(nk)
          frontier.add(nk)
        }
      }
    }
    if (curS !== startK) vis += 1

    // Expand end side
    if (pqE.length) {
      const curE = pqE.shift()!.k
      if (openE.has(curE)) {
        openE.delete(curE)
        frontier.delete(curE)
        visE.add(curE)
        const [er, ec] = curE.split(",").map(Number) as [number, number]

        if (visS.has(curE) || openS.has(curE)) {
          const path = merge(curE)
          yield* paintPath(new Set([...visS, ...visE]), frontier, path, vis)
          return
        }

        for (const n of neighbors(grid, er, ec)) {
          const nk = key(n.r, n.c)
          const tg = (gE.get(curE) ?? Infinity) + costAt(grid, n.r, n.c)
          if (tg < (gE.get(nk) ?? Infinity)) {
            cameE.set(nk, curE)
            gE.set(nk, tg)
            const f = tg + hScore(n, grid.start)
            if (!openE.has(nk)) {
              count += 1
              push(pqE, { f, c: count, k: nk })
              openE.add(nk)
              frontier.add(nk)
            }
          }
        }
        if (curE !== endK) vis += 1
      }
    }

    yield frameBase(new Set([...visS, ...visE]), frontier, new Set(), curS, {
      visitedCount: vis,
      pathLength: 0,
    })
  }

  yield frameBase(new Set([...visS, ...visE]), frontier, new Set(), null, {
    done: true,
    found: false,
    pathLength: 0,
    visitedCount: vis,
  })
}

export function* bellmanFord(grid: GridModel): PathGenerator {
  const startK = key(grid.start.r, grid.start.c)
  const endK = key(grid.end.r, grid.end.c)
  const nodes: string[] = []
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (grid.cells[r]![c] !== "wall") nodes.push(key(r, c))
    }
  }

  const dist = new Map<string, number>()
  for (const n of nodes) dist.set(n, Infinity)
  dist.set(startK, 0)

  const visited = new Set<string>()
  const frontier = new Set<string>()

  // |V|-1 relaxation rounds; yield periodically for visualization
  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false
    for (const nk of nodes) {
      const [r, c] = nk.split(",").map(Number) as [number, number]
      if ((dist.get(nk) ?? Infinity) === Infinity) continue
      for (const n of neighbors(grid, r, c)) {
        const to = key(n.r, n.c)
        const nd = (dist.get(nk) ?? Infinity) + costAt(grid, n.r, n.c)
        if (nd < (dist.get(to) ?? Infinity)) {
          dist.set(to, nd)
          frontier.add(to)
          visited.add(nk)
          updated = true
        }
      }
    }
    if (i % 2 === 0 || !updated) {
      yield frameBase(visited, frontier, new Set(), null, {
        visitedCount: visited.size,
        pathLength: 0,
      })
    }
    if (!updated) break
  }

  // Reconstruct via greedy neighbors
  const cameFrom = new Map<string, string>()
  let node = endK
  const guard = new Set<string>()
  while (node !== startK && !guard.has(node)) {
    guard.add(node)
    const [r, c] = node.split(",").map(Number) as [number, number]
    let best: string | null = null
    let bestD = Infinity
    for (const n of neighbors(grid, r, c)) {
      const nk = key(n.r, n.c)
      const d = dist.get(nk) ?? Infinity
      if (d < bestD) {
        bestD = d
        best = nk
      }
    }
    if (best == null || bestD === Infinity) break
    cameFrom.set(node, best)
    node = best
  }

  // Invert cameFrom (child -> parent) for reconstructPath which walks end->start via parent map
  const parent = new Map<string, string>()
  for (const [child, par] of cameFrom) parent.set(child, par)

  if ((dist.get(endK) ?? Infinity) === Infinity) {
    yield frameBase(visited, frontier, new Set(), null, {
      done: true,
      found: false,
      pathLength: 0,
      visitedCount: nodes.length,
    })
    return
  }

  const path = reconstructPath(parent, startK, endK)
  // reconstructPath expects parent[child]=parent walking from end; we stored that
  yield* paintPath(visited, frontier, path.length ? path : [startK, endK], nodes.length)
}

export type PathFn = (grid: GridModel) => PathGenerator

export const PATH_FNS: Record<string, PathFn> = {
  bfs,
  "bi-bfs": biBfs,
  dfs,
  dijkstra,
  astar,
  idastar,
  "bi-astar": biAstar,
  "bellman-ford": bellmanFord,
}
