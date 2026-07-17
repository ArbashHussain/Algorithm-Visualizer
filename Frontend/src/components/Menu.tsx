import type { CSSProperties } from "react"
import MenuItem from "./MenuItem"
import AIPreview from "./previews/AIPreview"
import PathfindingPreview from "./previews/PathfindingPreview"
import SortingPreview from "./previews/SortingPreview"

const menuItems = [
  {
    to: "/ai",
    index: "01",
    label: "AI Algorithms",
    description: "Search, heuristics, and learning — step by step.",
    preview: <AIPreview />,
  },
  {
    to: "/pathfinding",
    index: "02",
    label: "Pathfinding",
    description: "Watch search explore mazes and find routes.",
    preview: <PathfindingPreview />,
  },
  {
    to: "/sorting",
    index: "03",
    label: "Sorting",
    description: "Classic sorts rearranging data in real time.",
    preview: <SortingPreview />,
  },
] as const

export default function Menu() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-5 py-20 sm:px-8">
      <header className="mb-12 max-w-lg text-center sm:mb-14">
        <p className="mb-3 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Algorithm Visualizer
        </p>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]">
          Choose a visualizer
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
          Interactive demos for AI, pathfinding, and sorting.
        </p>
      </header>

      <nav
        className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_0_oklch(0_0_0/0.04)] sm:grid-cols-3 sm:rounded-none sm:border-0 sm:shadow-none dark:shadow-none"
        aria-label="Visualizer menu"
      >
        {menuItems.map((item, i) => (
          <MenuItem
            key={item.to}
            to={item.to}
            index={item.index}
            label={item.label}
            description={item.description}
            preview={item.preview}
            className={
              i > 0
                ? "border-t border-border sm:border-t-0 sm:border-l"
                : undefined
            }
            style={
              {
                animationDelay: `${80 + i * 70}ms`,
              } as CSSProperties
            }
          />
        ))}
      </nav>

      <p className="mt-14 text-center text-[11px] tracking-wide text-muted-foreground/60">
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
