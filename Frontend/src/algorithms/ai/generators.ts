/**
 * Placeholder only — real algorithms will come from the backend later.
 * Do not put algorithm logic here until backend contracts are ready.
 */
import type { AIAlgorithmMeta, AIFrame, AIVizKind } from "./types"

/** Empty / idle canvas state for a viz kind (no algorithm running). */
export function idleFrameForViz(viz: AIVizKind): AIFrame {
  switch (viz) {
    case "game-tree":
      return {
        kind: "game-tree",
        nodes: [],
        rootId: "",
        message: "Backend not connected",
      }
    case "board":
      return {
        kind: "board",
        mode: "nqueens",
        size: 8,
        board: Array.from({ length: 8 }, () =>
          Array.from({ length: 8 }, () => 0),
        ),
        message: "Backend not connected",
      }
    case "landscape":
      return {
        kind: "landscape",
        heights: Array.from({ length: 24 }, (_, i) => {
          const t = i / 23
          return 0.25 + 0.35 * Math.sin(t * Math.PI * 2) ** 2
        }),
        current: -1,
        best: -1,
        message: "Backend not connected",
      }
    case "points":
      return {
        kind: "points",
        mode: "kmeans",
        points: [],
        message: "Backend not connected",
      }
    case "network":
      return {
        kind: "network",
        layers: [3, 4, 3, 2],
        activations: [
          [0.2, 0.2, 0.2],
          [0.15, 0.15, 0.15, 0.15],
          [0.15, 0.15, 0.15],
          [0.1, 0.1],
        ],
        message: "Backend not connected",
      }
    case "grid-agent":
      return {
        kind: "grid-agent",
        rows: 7,
        cols: 10,
        cells: Array.from({ length: 7 }, () =>
          Array.from({ length: 10 }, () => 0),
        ),
        agent: { r: -1, c: -1 },
        message: "Backend not connected",
      }
    case "population":
      return {
        kind: "population",
        individuals: Array.from({ length: 12 }, () => ({
          fitness: 0.25,
        })),
        generation: 0,
        bestFitness: 0,
        avgFitness: 0,
        message: "Backend not connected",
      }
  }
}

/** Idle shell tuned slightly per algorithm (still no real logic). */
export function idleFrameForAlgo(meta: AIAlgorithmMeta): AIFrame {
  const frame = idleFrameForViz(meta.viz)

  if (frame.kind === "board") {
    if (meta.id === "sudoku") {
      return {
        ...frame,
        mode: "sudoku",
        size: 9,
        board: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 0),
        ),
      }
    }
    if (meta.id === "nqueens") {
      return { ...frame, mode: "nqueens", size: 8 }
    }
  }

  if (frame.kind === "points") {
    const modeMap: Partial<
      Record<
        AIAlgorithmMeta["id"],
        Extract<AIFrame, { kind: "points" }>["mode"]
      >
    > = {
      kmeans: "kmeans",
      dbscan: "dbscan",
      hierarchical: "hierarchical",
      agglomerative: "agglomerative",
      "gradient-descent": "gradient",
      pso: "pso",
      "ant-colony": "aco",
      perceptron: "perceptron",
      "linear-regression": "regression",
      "logistic-regression": "regression",
    }
    const mode = modeMap[meta.id]
    if (mode) return { ...frame, mode }
  }

  return frame
}
