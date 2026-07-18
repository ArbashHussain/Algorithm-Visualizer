import { useEffect, useState } from "react"

/** Black-and-white palette for canvas visualizers, synced to light/dark. */
export type VizPalette = {
  bg: string
  fg: string
  muted: string
  accent: string
  bar: string
  barActive: string
  barOther: string
  barPivot: string
  gridLine: string
  wall: string
  empty: string
  visited: string
  frontier: string
  path: string
  start: string
  end: string
  weight: string
  current: string
}

function readVizPalette(): VizPalette {
  const dark = document.documentElement.classList.contains("dark")
  if (dark) {
    return {
      bg: "transparent",
      fg: "rgba(250, 250, 250, 0.95)",
      muted: "rgba(250, 250, 250, 0.28)",
      accent: "rgba(250, 250, 250, 0.72)",
      bar: "rgba(250, 250, 250, 0.55)",
      barActive: "rgba(250, 250, 250, 0.95)",
      barOther: "rgba(250, 250, 250, 0.75)",
      barPivot: "rgba(250, 250, 250, 1)",
      gridLine: "rgba(250, 250, 250, 0.08)",
      wall: "rgba(250, 250, 250, 0.9)",
      empty: "rgba(250, 250, 250, 0.08)",
      visited: "rgba(250, 250, 250, 0.28)",
      frontier: "rgba(250, 250, 250, 0.48)",
      path: "rgba(250, 250, 250, 0.92)",
      start: "rgba(250, 250, 250, 1)",
      end: "rgba(250, 250, 250, 1)",
      weight: "rgba(250, 250, 250, 0.38)",
      current: "rgba(250, 250, 250, 0.85)",
    }
  }
  return {
    bg: "transparent",
    fg: "rgba(20, 20, 20, 0.92)",
    muted: "rgba(20, 20, 20, 0.22)",
    accent: "rgba(20, 20, 20, 0.65)",
    bar: "rgba(20, 20, 20, 0.45)",
    barActive: "rgba(20, 20, 20, 0.92)",
    barOther: "rgba(20, 20, 20, 0.7)",
    barPivot: "rgba(20, 20, 20, 1)",
    gridLine: "rgba(20, 20, 20, 0.08)",
    wall: "rgba(20, 20, 20, 0.88)",
    empty: "rgba(20, 20, 20, 0.06)",
    visited: "rgba(20, 20, 20, 0.22)",
    frontier: "rgba(20, 20, 20, 0.4)",
    path: "rgba(20, 20, 20, 0.85)",
    start: "rgba(20, 20, 20, 1)",
    end: "rgba(20, 20, 20, 1)",
    weight: "rgba(20, 20, 20, 0.32)",
    current: "rgba(20, 20, 20, 0.75)",
  }
}

export function useVizTheme(): VizPalette {
  const [palette, setPalette] = useState<VizPalette>(() =>
    typeof document !== "undefined"
      ? readVizPalette()
      : {
          bg: "transparent",
          fg: "rgba(20,20,20,0.92)",
          muted: "rgba(20,20,20,0.22)",
          accent: "rgba(20,20,20,0.65)",
          bar: "rgba(20,20,20,0.45)",
          barActive: "rgba(20,20,20,0.92)",
          barOther: "rgba(20,20,20,0.7)",
          barPivot: "rgba(20,20,20,1)",
          gridLine: "rgba(20,20,20,0.08)",
          wall: "rgba(20,20,20,0.88)",
          empty: "rgba(20,20,20,0.06)",
          visited: "rgba(20,20,20,0.22)",
          frontier: "rgba(20,20,20,0.4)",
          path: "rgba(20,20,20,0.85)",
          start: "rgba(20,20,20,1)",
          end: "rgba(20,20,20,1)",
          weight: "rgba(20,20,20,0.32)",
          current: "rgba(20,20,20,0.75)",
        },
  )

  useEffect(() => {
    const update = () => setPalette(readVizPalette())
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
