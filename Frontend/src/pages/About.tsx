import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function About() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-6 py-12 sm:py-16">
      <Button
        nativeButton={false}
        render={<Link to="/" />}
        variant="ghost"
        size="sm"
        className="-ml-2 mb-10 w-fit text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft data-icon="inline-start" />
        Back
      </Button>

      <p className="mb-3 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
        About
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
        Algorithm Visualizer
      </h1>

      <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
        <p>
          An interactive web app for exploring sorting, pathfinding, and AI
          algorithms through live visualizations.
        </p>
        <p>
          Pick a visualizer from the home menu, then watch each algorithm run
          step by step to build intuition for how it works.
        </p>
      </div>

      <p className="mt-12 text-[11px] tracking-wide text-muted-foreground/60">
        Created by{" "}
        <a
          href="https://github.com/ArbashHussain"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Arbash Hussain
        </a>
      </p>
    </main>
  )
}
