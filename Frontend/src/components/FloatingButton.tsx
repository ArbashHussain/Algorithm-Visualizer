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
      <div className="flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title={theme === "dark" ? "Light" : "Dark"}
        >
          {theme === "dark" ? (
            <Sun data-icon="inline-start" />
          ) : (
            <Moon data-icon="inline-start" />
          )}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>

        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />

        <Button
          nativeButton={false}
          render={<Link to="/about" />}
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
        >
          <Info data-icon="inline-start" />
          About
        </Button>

        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />

        <Button
          nativeButton={false}
          render={
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
        >
          <ExternalLink data-icon="inline-start" />
          GitHub
        </Button>
      </div>
    </div>
  )
}
