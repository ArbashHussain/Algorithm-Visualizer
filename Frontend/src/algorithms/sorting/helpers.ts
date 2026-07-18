import type { HighlightRole, SortFrame } from "./types"

export function snapshot(
  arr: number[],
  highlights: Record<number, HighlightRole> = {},
): SortFrame {
  return { values: arr.slice(), highlights: { ...highlights } }
}

export function generateList(
  n: number,
  minVal = 1,
  maxVal = 100,
  uniform = false,
): number[] {
  const lst: number[] = []
  for (let i = 0; i < n; i++) {
    if (uniform) {
      lst.push(Math.random())
    } else {
      lst.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal)
    }
  }
  return lst
}

/** Min-run for TimSort (same logic as Python calculate_min_run). */
export function calculateMinRun(n: number): number {
  const MIN_MERGE = 32
  let r = 0
  let nn = n
  while (nn >= MIN_MERGE) {
    r |= nn & 1
    nn >>= 1
  }
  return nn + r
}
