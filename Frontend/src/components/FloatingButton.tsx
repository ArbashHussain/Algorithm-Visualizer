import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ExternalLink, Info, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const GITHUB_URL = "https://github.com/ArbashHussain/Algorithm-Visualizer"
const THEME_KEY = "theme"

type Theme = "light" | "dark"

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  localStorage.setItem(THEME_KEY, theme)
}

export default function FloatingButton() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <div className="flex items-center gap-0.5 rounded-full border border-border/80 bg-background/80 p-1 shadow-[0_8px_30px_oklch(0_0_0/0.06)] backdrop-blur-xl dark:border-border dark:shadow-[0_8px_30px_oklch(0_0_0/0.35)]">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <span className="mx-0.5 h-3.5 w-px shrink-0 bg-border" aria-hidden />

        <Button
          nativeButton={false}
          render={<Link to="/about" />}
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="About"
          title="About"
        >
          <Info />
        </Button>

        <Button
          nativeButton={false}
          render={
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" />
          }
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label="GitHub repository"
          title="GitHub"
        >
          <ExternalLink />
        </Button>
      </div>
    </div>
  )
}
