import { useEffect, useState } from "react"

export type PreviewPalette = {
  fg: string
  muted: string
  accent: string
  bg: string
}

function readPalette(): PreviewPalette {
  const dark = document.documentElement.classList.contains("dark")
  if (dark) {
    return {
      fg: "rgba(250, 250, 250, 0.92)",
      muted: "rgba(250, 250, 250, 0.28)",
      accent: "rgba(250, 250, 250, 0.72)",
      bg: "transparent",
    }
  }
  return {
    fg: "rgba(20, 20, 20, 0.9)",
    muted: "rgba(20, 20, 20, 0.22)",
    accent: "rgba(20, 20, 20, 0.65)",
    bg: "transparent",
  }
}

/** Reactively tracks light/dark for canvas previews. */
export function usePreviewTheme(): PreviewPalette {
  const [palette, setPalette] = useState<PreviewPalette>(() =>
    typeof document !== "undefined"
      ? readPalette()
      : {
          fg: "rgba(20,20,20,0.9)",
          muted: "rgba(20,20,20,0.22)",
          accent: "rgba(20,20,20,0.65)",
          bg: "transparent",
        },
  )

  useEffect(() => {
    const update = () => setPalette(readPalette())
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => mo.disconnect()
  }, [])

  return palette
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
