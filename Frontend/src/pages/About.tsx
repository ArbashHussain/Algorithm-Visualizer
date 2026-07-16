import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function About() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-6 py-10">
      <Button
        nativeButton={false}
        render={<Link to="/" />}
        variant="ghost"
        size="sm"
        className="mb-6 w-fit"
      >
        <ArrowLeft data-icon="inline-start" />
        Back to menu
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <div className="mt-4 space-y-4 text-muted-foreground">
        <p>
          Algorithm Visualizer is an interactive web app for exploring sorting,
          pathfinding, and AI algorithms through live visualizations.
        </p>
        <p>
          Choose a visualizer from the home menu, then watch algorithms run step
          by step to build intuition for how they work.
        </p>
        <p className="pt-2 text-sm text-muted-foreground/80">
          Created by{" "}
          <a
            href="https://github.com/ArbashHussain"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Arbash Hussain
          </a>
        </p>
      </div>
    </main>
  )
}
