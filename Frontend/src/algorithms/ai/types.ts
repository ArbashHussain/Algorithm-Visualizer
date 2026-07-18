/**
 * AI Algorithms — shared types for the visualizer.
 *
 * Frame contracts are the API surface between algorithm step generators
 * and AICanvas. When you implement real algorithms (client or backend),
 * yield AIFrame objects matching these shapes; the UI will render them.
 */

/** High-level grouping shown in the sidebar. */
export type AICategory =
  | "games"
  | "optimization"
  | "learning"
  | "constraint"

/** Canvas renderer mode for an algorithm. */
export type AIVizKind =
  | "game-tree"
  | "board"
  | "landscape"
  | "points"
  | "network"
  | "grid-agent"
  | "population"

export type AIAlgorithmId =
  // Games & adversarial search
  | "minimax"
  | "alpha-beta"
  // Optimization / metaheuristics
  | "hill-climbing"
  | "genetic"
  | "pso"
  | "gradient-descent"
  | "ant-colony"
  | "tabu-search"
  // Learning — supervised / nets
  | "perceptron"
  | "linear-regression"
  | "logistic-regression"
  | "decision-tree"
  | "neural-net"
  | "backpropagation"
  | "boosting"
  // Learning — clustering
  | "kmeans"
  | "dbscan"
  | "hierarchical"
  | "agglomerative"
  // Learning — RL
  | "qlearning"
  // Constraint satisfaction
  | "nqueens"
  | "sudoku"

export type AIAlgorithmMeta = {
  id: AIAlgorithmId
  label: string
  category: AICategory
  /** Short blurb for the info panel. */
  description: string
  /** Which canvas mode to use. */
  viz: AIVizKind
  /** Optional note for implementers (backend). */
  notes?: string
}

// ---------------------------------------------------------------------------
// Frame payload pieces
// ---------------------------------------------------------------------------

export type AIFrameBase = {
  done?: boolean
  /** Status line under the title / stats. */
  message?: string
  stats?: Record<string, string | number>
}

export type TreeNodeState =
  | "idle"
  | "exploring"
  | "evaluated"
  | "pruned"
  | "best"
  | "current"

export type GameTreeNode = {
  id: string
  parentId: string | null
  label: string
  value?: number | null
  role: "max" | "min" | "chance" | "terminal"
  state: TreeNodeState
  depth: number
  /** Sibling order for layout (0-based). */
  order: number
  visits?: number
  /** UCB / win rate text for MCTS */
  detail?: string
}

export type GameTreeFrame = AIFrameBase & {
  kind: "game-tree"
  nodes: GameTreeNode[]
  rootId: string
}

/**
 * Board games / CSP.
 * - tic-tac-toe: 0 empty, 1 X, 2 O
 * - nqueens: 0 empty, 1 queen, 2 attacked (optional hint)
 * - sudoku: 0 empty, 1–9 digit (or use board values 0–9)
 */
export type BoardFrame = AIFrameBase & {
  kind: "board"
  mode: "tic-tac-toe" | "nqueens" | "sudoku"
  size: number
  board: number[][]
  cursor?: { r: number; c: number }
  /** Winning line or focus cells */
  highlight?: { r: number; c: number }[]
}

/** 1D search landscape (hill climbing, simulated annealing). */
export type LandscapeFrame = AIFrameBase & {
  kind: "landscape"
  heights: number[]
  current: number
  best: number
  temperature?: number
  /** Indices visited so far */
  visited?: number[]
  /** Candidate being considered */
  candidate?: number
}

export type Point2 = {
  x: number
  y: number
  cluster?: number
  active?: boolean
}

/** Scatter / particles / optimizer trail on a 2D plane (0..1 coords). */
export type PointsFrame = AIFrameBase & {
  kind: "points"
  mode:
    | "kmeans"
    | "dbscan"
    | "hierarchical"
    | "agglomerative"
    | "gradient"
    | "pso"
    | "aco"
    | "perceptron"
    | "regression"
  points: Point2[]
  centroids?: Point2[]
  particles?: Array<Point2 & { vx?: number; vy?: number }>
  trail?: Point2[]
  /** Optional decision boundary / fit line samples */
  line?: Point2[]
  /** Optional scalar field samples for background (row-major, values 0..1) */
  field?: { cols: number; rows: number; values: number[] }
}

export type NetworkFrame = AIFrameBase & {
  kind: "network"
  layers: number[]
  /** Activation in [0, 1] per node per layer */
  activations: number[][]
  activeLayer?: number
  /** Highlight backward pass */
  backward?: boolean
}

export type GridAgentFrame = AIFrameBase & {
  kind: "grid-agent"
  rows: number
  cols: number
  /**
   * 0 empty, 1 wall, 2 goal, 3 start marker cell
   */
  cells: number[][]
  agent: { r: number; c: number }
  /** Max Q per cell for heat (0..1), optional */
  qHeat?: number[][]
  episode?: number
  reward?: number
  path?: { r: number; c: number }[]
}

export type PopulationIndividual = {
  fitness: number
  /** Normalized gene bars 0..1 for small genome display */
  genes?: number[]
  selected?: boolean
  elite?: boolean
  mutated?: boolean
}

export type PopulationFrame = AIFrameBase & {
  kind: "population"
  individuals: PopulationIndividual[]
  generation: number
  bestFitness: number
  avgFitness: number
}

export type AIFrame =
  | GameTreeFrame
  | BoardFrame
  | LandscapeFrame
  | PointsFrame
  | NetworkFrame
  | GridAgentFrame
  | PopulationFrame

export type AIGenerator = Generator<AIFrame, AIFrame | void, unknown>

export type AIFn = () => AIGenerator

export const AI_CATEGORIES: {
  id: AICategory
  label: string
}[] = [
  { id: "games", label: "Games & Search" },
  { id: "optimization", label: "Optimization" },
  { id: "learning", label: "Learning" },
  { id: "constraint", label: "Constraint" },
]
