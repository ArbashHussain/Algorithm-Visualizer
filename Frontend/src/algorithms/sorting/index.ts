import type { SortAlgorithmMeta } from "./types"
import { SORT_FNS } from "./sorts"

export * from "./types"
export * from "./helpers"
export { SORT_FNS } from "./sorts"

export const SORT_ALGORITHMS: SortAlgorithmMeta[] = [
  { id: "bubble", label: "Bubble Sort" },
  { id: "selection", label: "Selection Sort" },
  { id: "insertion", label: "Insertion Sort" },
  { id: "merge", label: "Merge Sort" },
  { id: "quick", label: "Quick Sort" },
  { id: "tim", label: "Tim Sort" },
  { id: "radix", label: "Radix Sort" },
  { id: "bucket", label: "Bucket Sort", requiresUniform: true },
]

export function getSortFn(id: string) {
  return SORT_FNS[id]
}
