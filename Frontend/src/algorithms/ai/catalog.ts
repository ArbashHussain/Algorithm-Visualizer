import type { AIAlgorithmMeta } from "./types"

/**
 * Canonical list of AI algorithms exposed in the UI.
 * Real step logic will come from the backend later — this is catalog + viz mapping only.
 */
export const AI_ALGORITHMS: AIAlgorithmMeta[] = [
  // --- Games & adversarial search ---
  {
    id: "minimax",
    label: "Minimax",
    category: "games",
    viz: "game-tree",
    description:
      "Depth-first evaluation of a game tree. Max maximizes, Min minimizes the score.",
    notes: "Yield GameTreeFrame nodes with max/min roles and evaluated values.",
  },
  {
    id: "alpha-beta",
    label: "Alpha-Beta",
    category: "games",
    viz: "game-tree",
    description:
      "Minimax with alpha-beta pruning — skips branches that cannot affect the result.",
    notes: "Mark pruned nodes with state: 'pruned'.",
  },
  // --- Optimization / metaheuristics ---
  {
    id: "hill-climbing",
    label: "Hill Climbing",
    category: "optimization",
    viz: "landscape",
    description:
      "Greedy local search: move to a better neighbor until a peak (local optimum).",
    notes: "LandscapeFrame with heights[], current, best indices.",
  },
  {
    id: "tabu-search",
    label: "Tabu Search",
    category: "optimization",
    viz: "landscape",
    description:
      "Local search that forbids recent moves (tabu list) to escape local optima.",
    notes:
      "LandscapeFrame + stats for tabu tenure; mark forbidden neighbors in stats/message.",
  },
  {
    id: "genetic",
    label: "Genetic Algo",
    category: "optimization",
    viz: "population",
    description:
      "Evolve a population via selection, crossover, and mutation over generations.",
    notes: "PopulationFrame: individuals with fitness, generation counters.",
  },
  {
    id: "pso",
    label: "Particle Swarm",
    category: "optimization",
    viz: "points",
    description:
      "Particles share personal and global bests to swarm toward good regions.",
    notes: "PointsFrame mode 'pso' with particles[] positions.",
  },
  {
    id: "ant-colony",
    label: "Ant Colony",
    category: "optimization",
    viz: "points",
    description:
      "Ant Colony Optimization — pheromone trails guide construction of good paths/tours.",
    notes:
      "PointsFrame mode 'aco': particles as ants; trail/field for pheromone intensity.",
  },
  {
    id: "gradient-descent",
    label: "Gradient Descent",
    category: "optimization",
    viz: "points",
    description:
      "Follow the negative gradient of a loss surface toward a minimum.",
    notes: "PointsFrame mode 'gradient' with trail[] and optional field heatmap.",
  },

  // --- Learning — supervised ---
  {
    id: "perceptron",
    label: "Perceptron",
    category: "learning",
    viz: "points",
    description:
      "Linear binary classifier: update weights when a point is misclassified.",
    notes:
      "PointsFrame mode 'perceptron': labeled points + line[] for decision boundary.",
  },
  {
    id: "linear-regression",
    label: "Linear Regression",
    category: "learning",
    viz: "points",
    description:
      "Fit a line that minimizes squared error (often via gradient descent).",
    notes:
      "PointsFrame mode 'regression': scatter points + line[] for the fitted model.",
  },
  {
    id: "logistic-regression",
    label: "Logistic Regression",
    category: "learning",
    viz: "points",
    description:
      "Probabilistic linear classifier with a sigmoid decision boundary.",
    notes:
      "PointsFrame mode 'regression': two-class points + line/curve boundary.",
  },
  {
    id: "decision-tree",
    label: "Decision Tree",
    category: "learning",
    viz: "game-tree",
    description:
      "Build a tree by recursive feature splits (e.g. ID3 / C4.5 / CART style).",
    notes:
      "GameTreeFrame: nodes = feature tests, leaves = class/value; state for current split.",
  },
  {
    id: "neural-net",
    label: "Neural Net",
    category: "learning",
    viz: "network",
    description:
      "Feed-forward pass: activations flow layer by layer through the network.",
    notes: "NetworkFrame: layers + activations; activeLayer for current step.",
  },
  {
    id: "backpropagation",
    label: "Backpropagation",
    category: "learning",
    viz: "network",
    description:
      "Train a net by propagating error backward and updating weights.",
    notes:
      "NetworkFrame with backward: true; show error flow + weight updates in stats.",
  },
  {
    id: "boosting",
    label: "Boosting",
    category: "learning",
    viz: "population",
    description:
      "Ensemble of weak learners (e.g. AdaBoost) — reweight samples, add learners.",
    notes:
      "PopulationFrame: each bar = weak learner weight / sample weight; generation = round.",
  },

  // --- Learning — clustering ---
  {
    id: "kmeans",
    label: "K-Means",
    category: "learning",
    viz: "points",
    description:
      "Cluster points by assigning to nearest centroid, then updating centroids.",
    notes: "PointsFrame mode 'kmeans': points.cluster + centroids[].",
  },
  {
    id: "dbscan",
    label: "DBSCAN",
    category: "learning",
    viz: "points",
    description:
      "Density-based clustering — core points, border points, and noise.",
    notes:
      "PointsFrame mode 'dbscan': cluster ids; noise can use cluster = -1.",
  },
  {
    id: "hierarchical",
    label: "Hierarchical",
    category: "learning",
    viz: "points",
    description:
      "Hierarchical clustering — build a dendrogram by merging or splitting clusters.",
    notes:
      "PointsFrame mode 'hierarchical'; optional tree levels via stats/generation.",
  },
  {
    id: "agglomerative",
    label: "Agglomerative",
    category: "learning",
    viz: "points",
    description:
      "Bottom-up hierarchical clustering: start with single points, merge nearest.",
    notes:
      "PointsFrame mode 'agglomerative': show merges step-by-step; linkage in stats.",
  },

  // --- Learning — RL ---
  {
    id: "qlearning",
    label: "Q-Learning",
    category: "learning",
    viz: "grid-agent",
    description:
      "Tabular RL agent learns action values on a grid via reward and exploration.",
    notes: "GridAgentFrame: cells, agent position, optional qHeat.",
  },
  // --- Constraint satisfaction ---
  {
    id: "nqueens",
    label: "N-Queens",
    category: "constraint",
    viz: "board",
    description:
      "Place N queens so none attack — classic backtracking CSP demo.",
    notes: "BoardFrame mode 'nqueens': 1 = queen, 2 = conflict/attack optional.",
  },
  {
    id: "sudoku",
    label: "Sudoku CSP",
    category: "constraint",
    viz: "board",
    description:
      "Solve Sudoku as a CSP — backtracking + optional AC-3 / forward checking.",
    notes:
      "BoardFrame mode 'sudoku' size 9: cells 0 empty, 1–9 filled; cursor = assign.",
  },
]
