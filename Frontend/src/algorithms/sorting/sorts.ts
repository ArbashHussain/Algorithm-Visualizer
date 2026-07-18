/**
 * Sorting algorithm step generators.
 * Control flow mirrors Backend/sort_algos.py; drawing/sound stripped.
 * Each yield is a visual frame (array snapshot + highlights).
 */
import { calculateMinRun, snapshot } from "./helpers"
import type { SortFn, SortGenerator } from "./types"

export function* bubbleSort(arr: number[], ascending: boolean): SortGenerator {
  const a = arr
  const high = a.length
  for (let i = 0; i < high; i++) {
    for (let j = 0; j < high - i - 1; j++) {
      if (
        (a[j]! > a[j + 1]! && ascending) ||
        (a[j]! < a[j + 1]! && !ascending)
      ) {
        ;[a[j], a[j + 1]] = [a[j + 1]!, a[j]!]
        yield snapshot(a, { [j]: "current", [j + 1]: "other" })
      }
    }
  }
  return a
}

export function* selectionSort(arr: number[], ascending: boolean): SortGenerator {
  const a = arr
  const high = a.length
  for (let i = 0; i < high; i++) {
    let minIdx = i
    for (let j = i + 1; j < high; j++) {
      if (
        (a[j]! < a[minIdx]! && ascending) ||
        (a[j]! > a[minIdx]! && !ascending)
      ) {
        minIdx = j
        yield snapshot(a, { [i]: "current", [minIdx]: "other" })
      }
    }
    ;[a[i], a[minIdx]] = [a[minIdx]!, a[i]!]
    yield snapshot(a, { [i]: "current", [minIdx]: "other" })
  }
  return a
}

export function* insertionSort(
  arr: number[],
  ascending: boolean,
  low = 0,
  high?: number,
): SortGenerator {
  const a = arr
  const end = high ?? a.length
  for (let i = low; i < end; i++) {
    const key = a[i]!
    let j = i - 1
    if (ascending) {
      while (j >= low && a[j]! > key) {
        a[j + 1] = a[j]!
        j -= 1
        yield snapshot(a, { [j]: "current", [j + 1]: "other" })
      }
      a[j + 1] = key
      yield snapshot(a, { [j + 1]: "pivot" })
    } else {
      while (j >= low && a[j]! < key) {
        a[j + 1] = a[j]!
        j -= 1
        yield snapshot(a, { [j]: "current", [j + 1]: "other" })
      }
      a[j + 1] = key
      yield snapshot(a, { [j + 1]: "pivot" })
    }
  }
  return a
}

function* mergeRange(
  lst: number[],
  l: number,
  m: number,
  r: number,
  ascending: boolean,
): SortGenerator {
  const n1 = m - l + 1
  const n2 = r - m
  const L = new Array<number>(n1)
  const R = new Array<number>(n2)
  for (let i = 0; i < n1; i++) L[i] = lst[l + i]!
  for (let j = 0; j < n2; j++) R[j] = lst[m + 1 + j]!

  let i = 0
  let j = 0
  let k = l

  while (i < n1 && j < n2) {
    if ((L[i]! <= R[j]! && ascending) || (L[i]! >= R[j]! && !ascending)) {
      lst[k] = L[i]!
      i += 1
    } else {
      lst[k] = R[j]!
      j += 1
    }
    k += 1
    yield snapshot(lst, { [k]: "current" })
  }
  while (i < n1) {
    lst[k] = L[i]!
    i += 1
    k += 1
    yield snapshot(lst, { [k]: "current" })
  }
  while (j < n2) {
    lst[k] = R[j]!
    j += 1
    k += 1
    yield snapshot(lst, { [k]: "current" })
  }
  return lst
}

function* mergeSortRec(
  lst: number[],
  l: number,
  r: number,
  ascending: boolean,
): SortGenerator {
  if (l < r) {
    const m = Math.floor((l + (r - 1)) / 2)
    yield* mergeSortRec(lst, l, m, ascending)
    yield* mergeSortRec(lst, m + 1, r, ascending)
    yield* mergeRange(lst, l, m, r, ascending)
  }
  return lst
}

export function* mergeSort(arr: number[], ascending: boolean): SortGenerator {
  yield* mergeSortRec(arr, 0, arr.length - 1, ascending)
  return arr
}

function* partition(
  lst: number[],
  low: number,
  high: number,
  ascending: boolean,
): Generator<{ type: "frame"; frame: ReturnType<typeof snapshot> } | { type: "pi"; pi: number }> {
  let i = low - 1
  const pivot = lst[high]!
  for (let j = low; j < high; j++) {
    if (
      (lst[j]! < pivot && ascending) ||
      (lst[j]! > pivot && !ascending)
    ) {
      i += 1
      ;[lst[i], lst[j]] = [lst[j]!, lst[i]!]
      yield { type: "frame", frame: snapshot(lst, { [i]: "current", [j]: "other" }) }
    }
  }
  ;[lst[i + 1], lst[high]] = [lst[high]!, lst[i + 1]!]
  yield { type: "frame", frame: snapshot(lst, { [i + 1]: "current", [high]: "other" }) }
  yield { type: "pi", pi: i + 1 }
}

function* quickSortRec(
  lst: number[],
  low: number,
  high: number,
  ascending: boolean,
): SortGenerator {
  if (low < high) {
    let pi = -1
    for (const step of partition(lst, low, high, ascending)) {
      if (step.type === "frame") yield step.frame
      else pi = step.pi
    }
    yield* quickSortRec(lst, low, pi - 1, ascending)
    yield* quickSortRec(lst, pi + 1, high, ascending)
  }
  return lst
}

export function* quickSort(arr: number[], ascending: boolean): SortGenerator {
  yield* quickSortRec(arr, 0, arr.length - 1, ascending)
  return arr
}

/** Tim-sort merge (same as Python merge for runs). */
function* timMerge(
  arr: number[],
  l: number,
  m: number,
  r: number,
  ascending: boolean,
): SortGenerator {
  const len1 = m - l + 1
  const len2 = r - m
  const left: number[] = []
  const right: number[] = []
  for (let i = 0; i < len1; i++) left.push(arr[l + i]!)
  for (let i = 0; i < len2; i++) right.push(arr[m + i + 1]!)

  let i = 0
  let j = 0
  let k = l

  while (i < len1 && j < len2) {
    if (ascending) {
      if (left[i]! <= right[j]!) {
        arr[k] = left[i]!
        i += 1
      } else {
        arr[k] = right[j]!
        j += 1
      }
    } else {
      if (left[i]! >= right[j]!) {
        arr[k] = left[i]!
        i += 1
      } else {
        arr[k] = right[j]!
        j += 1
      }
    }
    yield snapshot(arr, { [k]: "current" })
    k += 1
  }
  while (i < len1) {
    arr[k] = left[i]!
    k += 1
    i += 1
    yield snapshot(arr, {})
  }
  while (j < len2) {
    arr[k] = right[j]!
    k += 1
    j += 1
    yield snapshot(arr, {})
  }
  return arr
}

export function* timSort(arr: number[], ascending: boolean): SortGenerator {
  const high = arr.length
  const low = 0
  const minRun = calculateMinRun(high)
  for (let i = low; i < high; i += minRun) {
    const end = Math.min(i + minRun - 1, high - 1)
    yield* insertionSort(arr, ascending, i, end + 1)
  }
  let size = minRun
  while (size < high) {
    for (let left = low; left < high; left += 2 * size) {
      const mid = Math.min(left + size - 1, high - 1)
      const right = Math.min(left + 2 * size - 1, high - 1)
      if (mid < right) {
        yield* timMerge(arr, left, mid, right, ascending)
      }
    }
    size = 2 * size
  }
  return arr
}

export function* bucketSort(arr: number[], ascending: boolean): SortGenerator {
  const lst = arr
  const slotNum = 10
  const buckets: number[][] = Array.from({ length: slotNum }, () => [])
  for (const j of lst) {
    const indexB = Math.min(slotNum - 1, Math.floor(slotNum * j))
    buckets[indexB]!.push(j)
  }
  for (let i = 0; i < slotNum; i++) {
    buckets[i] = buckets[i]!.slice().sort((a, b) => (ascending ? a - b : b - a))
  }
  let k = 0
  const bucketRange = ascending
    ? Array.from({ length: slotNum }, (_, i) => i)
    : Array.from({ length: slotNum }, (_, i) => slotNum - 1 - i)
  for (const i of bucketRange) {
    for (const item of buckets[i]!) {
      lst[k] = item
      k += 1
      yield snapshot(lst, { [k]: "current" })
    }
  }
  return lst
}

function* radixCountSort(
  arr: number[],
  place: number,
  ascending: boolean,
): SortGenerator {
  const n = arr.length
  const outputArr = new Array<number>(n).fill(0)
  const count = new Array<number>(10).fill(0)

  for (let i = 0; i < n; i++) {
    const index = arr[i]! / place
    count[Math.floor(index % 10)]! += 1
  }
  for (let i = 1; i < 10; i++) {
    count[i]! += count[i - 1]!
  }

  if (ascending) {
    let i = n - 1
    while (i >= 0) {
      const index = arr[i]! / place
      const d = Math.floor(index % 10)
      outputArr[count[d]! - 1] = arr[i]!
      count[d]! -= 1
      i -= 1
    }
  } else {
    let i = 0
    while (i < n) {
      const index = arr[i]! / place
      const d = Math.floor(index % 10)
      outputArr[n - count[d]!] = arr[i]!
      count[d]! -= 1
      i += 1
    }
  }

  for (let i = 0; i < n; i++) {
    arr[i] = outputArr[i]!
    yield snapshot(arr, { [i]: "current" })
  }
  return arr
}

export function* radixSort(arr: number[], ascending: boolean): SortGenerator {
  // Radix expects non-negative integers (as in Backend).
  const ints = arr.map((v) => Math.max(0, Math.floor(v)))
  for (let i = 0; i < arr.length; i++) arr[i] = ints[i]!

  const maxEle = Math.max(...arr, 0)
  let place = 1
  while (Math.floor(maxEle / place) > 0) {
    yield* radixCountSort(arr, place, ascending)
    place *= 10
  }
  return arr
}

export const SORT_FNS: Record<string, SortFn> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: (arr, asc) => insertionSort(arr, asc),
  merge: mergeSort,
  quick: quickSort,
  tim: timSort,
  bucket: bucketSort,
  radix: radixSort,
}
