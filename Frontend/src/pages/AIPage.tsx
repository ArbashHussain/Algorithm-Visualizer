import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react"
import {
  AI_ALGORITHMS,
  AI_CATEGORIES,
  idleFrameForAlgo,
  type AIAlgorithmId,
  type AIFrame,
} from "@/algorithms/ai"
import AICanvas from "@/components/visualizer/AICanvas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AIPage() {
  const [algo, setAlgo] = useState<AIAlgorithmId>("minimax")
  const [speed, setSpeed] = useState(50)
  const meta = AI_ALGORITHMS.find((a) => a.id === algo)!

  const frame: AIFrame = useMemo(() => idleFrameForAlgo(meta), [meta])

  const selectAlgo = (id: AIAlgorithmId) => {
    setAlgo(id)
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
            AI Algorithms
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            UI ready — algorithms will connect from the backend.
          </p>
        </div>
      </div>

      {/* Same shell as Pathfinder / Sorting: stretch columns, flex canvas */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-90 flex-col rounded-xl border border-border bg-card sm:min-h-[480px]">
          {/*
            flex-1 + min-h-0 + absolute canvas: fills the card like other
            visualizers without ResizeObserver height feedback.
          */}
          <div className="relative min-h-0 flex-1 p-3 sm:p-4">
            <div className="absolute inset-3 sm:inset-4">
              <AICanvas frame={frame} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="rounded-lg border border-border bg-background/90 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
                <p className="font-medium text-foreground">{meta.label}</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed">
                  Visualization shell only. Backend not wired yet.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            <Button
              size="sm"
              variant="default"
              disabled
              title="Backend not connected"
            >
              <Play data-icon="inline-start" /> Play
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Pause data-icon="inline-start" /> Pause
            </Button>
            <Button size="sm" variant="outline" disabled>
              <RotateCcw data-icon="inline-start" /> Reset
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

        <aside className="flex min-h-0 flex-col gap-4 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
          {AI_CATEGORIES.map((cat) => {
            const algos = AI_ALGORITHMS.filter((a) => a.category === cat.id)
            if (!algos.length) return null
            return (
              <section key={cat.id}>
                <h2 className="mb-1.5 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  {cat.label}
                </h2>
                <div className="grid grid-cols-2 gap-1">
                  {algos.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAlgo(a.id)}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-left text-[11px] font-medium leading-snug transition-colors",
                        algo === a.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}

          <section className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">{meta.label}</p>
            <p>{meta.description}</p>
            {meta.notes && (
              <p className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground/90">
                <span className="font-medium text-foreground/80">
                  Frame notes:{" "}
                </span>
                {meta.notes}
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
