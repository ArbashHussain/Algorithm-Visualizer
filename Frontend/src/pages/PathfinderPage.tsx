import { useCallback, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react"
import {
  clearWalls,
  createEmptyGrid,
  generateDfsMazeSteps,
  getPathFn,
  PATH_ALGORITHMS,
  setCell,
  type GridModel,
  type MazeGenerator,
  type PathAlgorithmId,
  type PathFrame,
  type PathGenerator,
} from "@/algorithms/pathfinding"
import PathfindingCanvas, {
  type PaintMode,
} from "@/components/visualizer/PathfindingCanvas"
import { Button } from "@/components/ui/button"
import { usePlayingState, useStepPlayer } from "@/hooks/useStepPlayer"
import { cn } from "@/lib/utils"

const DEFAULT_ROWS = 21

export default function PathfinderPage() {
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [grid, setGrid] = useState<GridModel>(() =>
    createEmptyGrid(DEFAULT_ROWS, DEFAULT_ROWS),
  )
  const [algo, setAlgo] = useState<PathAlgorithmId>("bfs")
  const [paintMode, setPaintMode] = useState<PaintMode>("wall")
  const [speed, setSpeed] = useState(55)
  const [frame, setFrame] = useState<PathFrame | null>(null)
  const [status, setStatus] = useState(
    "Draw walls, set start/end, then pick an algorithm.",
  )
  const [stats, setStats] = useState<{
    pathLength: number
    visitedCount: number
  } | null>(null)

  const genRef = useRef<PathGenerator | null>(null)
  const mazeGenRef = useRef<MazeGenerator | null>(null)
  /** Which animation the step player drives */
  const [animMode, setAnimMode] = useState<"search" | "maze" | null>(null)
  const animModeRef = useRef<"search" | "maze" | null>(null)
  const gridSnapRef = useRef(grid)
  const { playing, setPlaying, play, pause } = usePlayingState(false)

  // Maze gen is denser (many micro-steps); slightly snappier than search at same slider
  const stepMs = useMemo(() => {
    const base = Math.max(4, 100 - speed)
    return animMode === "maze" ? Math.max(2, Math.floor(base * 0.55)) : base
  }, [speed, animMode])
  const meta = PATH_ALGORITHMS.find((a) => a.id === algo)!

  const setMode = (mode: "search" | "maze" | null) => {
    animModeRef.current = mode
    setAnimMode(mode)
  }

  const stopAnimation = useCallback(() => {
    pause()
    genRef.current = null
    mazeGenRef.current = null
    animModeRef.current = null
    setAnimMode(null)
    setFrame(null)
  }, [pause])

  const handlePaint = useCallback(
    (r: number, c: number, mode: PaintMode) => {
      if (playing) return
      stopAnimation()
      setStats(null)
      setGrid((g) => {
        let kind: Parameters<typeof setCell>[3]
        if (mode === "erase") kind = "empty"
        else if (mode === "wall") kind = "wall"
        else if (mode === "weight") kind = "weight"
        else if (mode === "start") kind = "start"
        else kind = "end"
        const next = setCell(g, r, c, kind)
        gridSnapRef.current = next
        return next
      })
    },
    [playing, stopAnimation],
  )

  const resizeGrid = (nextRows: number) => {
    stopAnimation()
    setStats(null)
    setRows(nextRows)
    const g = createEmptyGrid(nextRows, nextRows)
    gridSnapRef.current = g
    setGrid(g)
    setStatus(`Grid set to ${nextRows}×${nextRows}.`)
  }

  const clearBoard = () => {
    stopAnimation()
    setStats(null)
    const g = clearWalls(gridSnapRef.current)
    gridSnapRef.current = g
    setGrid(g)
    setStatus("Cleared walls and weights.")
  }

  const applyMaze = (kind: "dfs") => {
    stopAnimation()
    setStats(null)
    setFrame(null)
    const gen = generateDfsMazeSteps(gridSnapRef.current)
    mazeGenRef.current = gen
    setMode("maze")
    setStatus(
      "Generating DFS maze…"
    )
    play()
  }

  const startSearchGenerator = useCallback(() => {
    const fn = getPathFn(algo)
    if (!fn) return false
    mazeGenRef.current = null
    setMode("search")
    genRef.current = fn(gridSnapRef.current)
    setStatus(`Running ${meta.label}…`)
    setStats(null)
    return true
  }, [algo, meta.label])

  const headFrame = (head: string | null): PathFrame | null => {
    if (!head) return null
    return {
      visited: new Set(),
      frontier: new Set(),
      path: new Set(),
      current: head,
    }
  }

  const onStep = useCallback(() => {
    // --- Maze generation animation ---
    if (animModeRef.current === "maze" && mazeGenRef.current) {
      const res = mazeGenRef.current.next()
      if (res.done) {
        const final = res.value
        if (final && "grid" in final) {
          gridSnapRef.current = final.grid
          setGrid(final.grid)
        }
        setFrame(null)
        setStatus("Maze generation complete.")
        setPlaying(false)
        mazeGenRef.current = null
        setMode(null)
        return false
      }
      gridSnapRef.current = res.value.grid
      setGrid(res.value.grid)
      setFrame(headFrame(res.value.head))
      if (res.value.done) {
        setFrame(null)
        setStatus("Maze generation complete.")
        setPlaying(false)
        mazeGenRef.current = null
        setMode(null)
        return false
      }
      return true
    }

    // --- Path search animation ---
    if (!genRef.current) {
      if (!startSearchGenerator()) return false
    }
    const res = genRef.current!.next()
    if (res.done) {
      const final = res.value as PathFrame | undefined
      if (final) {
        setFrame(final)
        if (final.stats) setStats(final.stats)
        setStatus(
          final.found
            ? `${meta.label} finished — path found.`
            : `${meta.label} finished — no path.`,
        )
      } else {
        setStatus(`${meta.label} finished.`)
      }
      setPlaying(false)
      genRef.current = null
      setMode(null)
      return false
    }
    setFrame(res.value)
    if (res.value.stats) setStats(res.value.stats)
    if (res.value.done) {
      setStatus(
        res.value.found
          ? `${meta.label} finished — path found.`
          : `${meta.label} finished — no path.`,
      )
      setPlaying(false)
      genRef.current = null
      setMode(null)
      return false
    }
    return true
  }, [meta.label, setPlaying, startSearchGenerator])

  useStepPlayer({ stepMs, onStep, playing })

  const handlePlay = () => {
    if (playing) {
      pause()
      setStatus(
        animModeRef.current === "maze"
          ? "Maze generation paused."
          : "Paused.",
      )
      return
    }
    // Resume maze if mid-generation; otherwise start/resume search
    if (animModeRef.current === "maze" && mazeGenRef.current) {
      setStatus("Generating maze…")
      play()
      return
    }
    if (!genRef.current) {
      setFrame(null)
      setStats(null)
      setMode("search")
    }
    play()
  }

  const resetSearch = () => {
    stopAnimation()
    setStats(null)
    setStatus("Search cleared. Grid kept.")
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
            Pathfinding Visualizer
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{status}</p>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-[360px] flex-col rounded-xl border border-border bg-card sm:min-h-[480px]">
          <div className="flex-1 p-3 sm:p-4">
            <PathfindingCanvas
              grid={grid}
              frame={frame}
              paintMode={paintMode}
              interactive={!playing}
              onPaint={handlePaint}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <Button size="sm" onClick={handlePlay}>
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
            <Button size="sm" variant="outline" onClick={resetSearch}>
              <RotateCcw data-icon="inline-start" /> Clear search
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearBoard}
              disabled={playing}
            >
              Clear walls
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
              {PATH_ALGORITHMS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={playing}
                  onClick={() => {
                    setAlgo(a.id)
                    resetSearch()
                    setStatus(`${a.label} selected.`)
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
              Draw
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["wall", "Wall"],
                  ["weight", "Weight"],
                  ["erase", "Erase"],
                  ["start", "Start"],
                  ["end", "End"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  size="xs"
                  variant={paintMode === id ? "default" : "outline"}
                  disabled={playing}
                  onClick={() => setPaintMode(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Maze
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="xs"
                variant="outline"
                disabled={playing}
                onClick={() => applyMaze("dfs")}
              >
                DFS Maze
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={playing}
                onClick={() => applyMaze("random")}
              >
                Random
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Grid size
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={playing || rows <= 11}
                onClick={() => resizeGrid(rows - 2)}
              >
                − Nodes
              </Button>
              <span className="min-w-[4rem] text-center text-sm tabular-nums">
                {rows}×{rows}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={playing || rows >= 41}
                onClick={() => resizeGrid(rows + 2)}
              >
                + Nodes
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Stats</p>
            {stats ? (
              <ul className="space-y-1">
                <li>Path length: {stats.pathLength}</li>
                <li>Visited nodes: {stats.visitedCount}</li>
                {stats.visitedCount > 0 && (
                  <li>
                    Efficiency:{" "}
                    {(stats.pathLength / stats.visitedCount).toFixed(3)}
                  </li>
                )}
              </ul>
            ) : (
              <p>Run a search to see path length and visited count.</p>
            )}
            <p className="mt-3 mb-1 font-medium text-foreground">Legend</p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium text-foreground">Start</span> — play
                icon (outline)
              </li>
              <li>
                <span className="font-medium text-foreground">End</span> — target
                bullseye
              </li>
              <li>
                <span className="font-medium text-foreground">Path</span> —
                trail with turns; final → on the cell before end (turn-aware)
              </li>
            </ul>
            <p className="mt-3 mb-1 font-medium text-foreground">
              Instructions
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Place start and end (or keep defaults).</li>
              <li>Draw walls or watch a maze generate live.</li>
              <li>Select a search algorithm and press Play.</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  )
}
