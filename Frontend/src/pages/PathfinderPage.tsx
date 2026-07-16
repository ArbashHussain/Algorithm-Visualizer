import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PathfinderPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-10">
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
      <h1 className="text-3xl font-semibold tracking-tight">
        Pathfinding Visualizer
      </h1>
      <p className="mt-2 text-muted-foreground">
        Visualize pathfinding algorithms here. Coming soon.
      </p>
    </main>
  )
}
