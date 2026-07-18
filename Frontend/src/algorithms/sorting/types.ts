/** Highlight roles for bars — mirrors Python color_positions intent. */
export type HighlightRole = "current" | "other" | "pivot"

export type SortFrame = {
  values: number[]
  highlights: Record<number, HighlightRole>
}

export type SortGenerator = Generator<SortFrame, number[], unknown>

export type SortFn = (
  arr: number[],
  ascending: boolean,
) => SortGenerator

export type SortAlgorithmId =
  | "bubble"
  | "selection"
  | "insertion"
  | "merge"
  | "quick"
  | "tim"
  | "bucket"
  | "radix"

export type SortAlgorithmMeta = {
  id: SortAlgorithmId
  label: string
  /** Bucket sort expects values in [0, 1). */
  requiresUniform?: boolean
}
