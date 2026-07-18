import { useCallback, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react"
import {
  generateList,
  getSortFn,
  SORT_ALGORITHMS,
  type HighlightRole,
  type SortAlgorithmId,
  type SortFrame,
  type SortGenerator,
} from "@/algorithms/sorting"
import SortingCanvas from "@/components/visualizer/SortingCanvas"
import { Button } from "@/components/ui/button"
import { usePlayingState, useStepPlayer } from "@/hooks/useStepPlayer"
import { cn } from "@/lib/utils"

const MIN_N = 10
const MAX_N = 120
const DEFAULT_N = 48

export default function SortingPage() {
  const [algo, setAlgo] = useState<SortAlgorithmId>("bubble")
  const [n, setN] = useState(DEFAULT_N)
  const [ascending, setAscending] = useState(true)
  const [uniform, setUniform] = useState(false)
  const [speed, setSpeed] = useState(40) // 1–100 → step ms inverted
  const [values, setValues] = useState(() => generateList(DEFAULT_N))
  const [highlights, setHighlights] = useState<Record<number, HighlightRole>>(
    {},
  )
  const [status, setStatus] = useState("Select an algorithm, then press Play.")
  const genRef = useRef<SortGenerator | null>(null)
  const baseRef = useRef(values)
  const { playing, setPlaying, play, pause } = usePlayingState(false)

  const stepMs = useMemo(() => Math.max(4, 120 - speed), [speed])

  const meta = SORT_ALGORITHMS.find((a) => a.id === algo)!

  const applyFrame = (frame: SortFrame) => {
    setValues(frame.values)
    setHighlights(frame.highlights)
  }

  const resetToBase = useCallback(() => {
    pause()
    genRef.current = null
    setValues(baseRef.current.slice())
    setHighlights({})
    setStatus("Ready. Press Play to start.")
  }, [pause])

  const regenerate = useCallback(
    (size = n, isUniform = uniform) => {
      pause()
      genRef.current = null
      const list = generateList(size, 1, 100, isUniform)
      baseRef.current = list
      setValues(list.slice())
      setHighlights({})
      setStatus("New array generated.")
    },
    [n, uniform, pause],
  )

  const startGenerator = useCallback(() => {
    const fn = getSortFn(algo)
    if (!fn) return false
    if (meta.requiresUniform && !uniform) {
      setStatus("Bucket Sort needs a uniform array (values in [0, 1)).")
      setPlaying(false)
      return false
    }
    const working = baseRef.current.slice()
    genRef.current = fn(working, ascending)
    setStatus(`Running ${meta.label}…`)
    return true
  }, [algo, ascending, meta, uniform, setPlaying])

  const onStep = useCallback(() => {
    if (!genRef.current) {
      if (!startGenerator()) return false
    }
    const res = genRef.current!.next()
    if (res.done) {
      if (res.value && Array.isArray(res.value)) {
        setValues(res.value.slice())
      }
      setHighlights({})
      setStatus(`${meta.label} complete.`)
      setPlaying(false)
      genRef.current = null
      // baseRef stays the pre-sort array so Reset / re-Play work correctly
      return false
    }
    applyFrame(res.value)
    return true
  }, [meta.label, setPlaying, startGenerator])

  useStepPlayer({ stepMs, onStep, playing })

  const handlePlay = () => {
    if (playing) {
      pause()
      setStatus("Paused.")
      return
    }
    // Fresh run from last generated (unsorted) base if generator finished
    if (!genRef.current) {
      setValues(baseRef.current.slice())
      setHighlights({})
    }
    play()
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          nativeButton={false}
          render={<Link to="/" />}
          variant="ghost"
          size="sm"
          className="w-fit"
        >
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sorting Visualizer
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{status}</p>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-[320px] flex-col rounded-xl border border-border bg-card sm:min-h-[420px]">
          <div className="flex-1 p-4 sm:p-6">
            <SortingCanvas values={values} highlights={highlights} />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <Button size="sm" onClick={handlePlay} variant="default">
              {playing ? (
                <>
                  <Pause data-icon="inline-start" /> Pause
                </>
              ) : (
                <>
                  <Play data-icon="inline-start" /> Play
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={resetToBase}>
              <RotateCcw data-icon="inline-start" /> Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => regenerate()}
              disabled={playing}
            >
              Generate
            </Button>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>Speed</span>
              <input
                type="range"
                min={1}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="h-1.5 w-28 cursor-pointer accent-foreground"
                aria-label="Animation speed"
              />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <section>
            <h2 className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Algorithms
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_ALGORITHMS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={playing}
                  onClick={() => {
                    setAlgo(a.id)
                    resetToBase()
                    if (a.requiresUniform && !uniform) {
                      setUniform(true)
                      regenerate(n, true)
                      setStatus("Switched to uniform array for Bucket Sort.")
                    } else {
                      setStatus(`${a.label} selected.`)
                    }
                  }}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-left text-xs font-medium transition-colors",
                    algo === a.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted",
                    playing && "opacity-60",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Settings
            </h2>
            <div className="space-y-3 rounded-xl border border-border p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="tabular-nums text-foreground">{n}</span>
              </label>
              <input
                type="range"
                min={MIN_N}
                max={MAX_N}
                value={n}
                disabled={playing}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setN(next)
                  regenerate(next, uniform)
                }}
                className="w-full accent-foreground"
                aria-label="Array size"
              />
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="xs"
                  variant={ascending ? "default" : "outline"}
                  disabled={playing}
                  onClick={() => setAscending(true)}
                >
                  Ascending
                </Button>
                <Button
                  size="xs"
                  variant={!ascending ? "default" : "outline"}
                  disabled={playing}
                  onClick={() => setAscending(false)}
                >
                  Descending
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="xs"
                  variant={!uniform ? "default" : "outline"}
                  disabled={playing}
                  onClick={() => {
                    setUniform(false)
                    regenerate(n, false)
                  }}
                >
                  Integer
                </Button>
                <Button
                  size="xs"
                  variant={uniform ? "default" : "outline"}
                  disabled={playing}
                  onClick={() => {
                    setUniform(true)
                    regenerate(n, true)
                  }}
                >
                  Uniform [0,1)
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Instructions</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Pick a sorting algorithm.</li>
              <li>Optionally change size or regenerate the array.</li>
              <li>Press Play to visualize steps.</li>
            </ol>
            {meta.requiresUniform && (
              <p className="mt-2 text-foreground/80">
                Bucket Sort uses uniform values in [0, 1).
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
