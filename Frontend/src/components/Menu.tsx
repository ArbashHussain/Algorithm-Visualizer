import { BrainCircuit, Map, ArrowUpDown } from "lucide-react"
import MenuItem from "./MenuItem"

const menuItems = [
  {
    to: "/ai",
    label: "AI Algorithms",
    description: "Explore and visualize AI algorithms step by step.",
    icon: BrainCircuit,
  },
  {
    to: "/pathfinding",
    label: "Pathfinding",
    description: "Watch search algorithms navigate mazes and grids.",
    icon: Map,
  },
  {
    to: "/sorting",
    label: "Sorting",
    description: "See classic sorting algorithms rearrange data live.",
    icon: ArrowUpDown,
  },
] as const

export default function Menu() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 max-w-xl text-center">
        <p className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Algorithm Visualizer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Choose a visualizer
        </h1>
        <p className="mt-3 text-muted-foreground">
          Interactive demos for AI, pathfinding, and sorting algorithms.
        </p>
      </div>

      <nav
        className="flex w-full max-w-4xl flex-row"
        aria-label="Visualizer menu"
      >
        {menuItems.map((item) => (
          <MenuItem key={item.to} {...item} />
        ))}
      </nav>

      <p className="absolute bottom-4 left-4 text-xs tracking-wide text-muted-foreground/70 sm:bottom-6 sm:left-6">
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
    </main>
  )
}
