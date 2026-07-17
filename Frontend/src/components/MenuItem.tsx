import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MenuItemProps = {
  to: string
  index: string
  label: string
  description: string
  preview: ReactNode
  className?: string
  style?: CSSProperties
}

export default function MenuItem({
  to,
  index,
  label,
  description,
  preview,
  className,
  style,
}: MenuItemProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link to={to} />}
      variant="ghost"
      style={style}
      className={cn(
        "menu-item-enter group/card relative h-auto min-h-0 w-full flex-col items-stretch justify-between gap-5 rounded-none border-0 bg-background p-6 text-left shadow-none transition-[background-color,transform] duration-300 ease-out hover:bg-muted/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.995] sm:aspect-square sm:p-7 dark:hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70">
          {index}
        </span>
        <ArrowUpRight
          className="size-4 text-muted-foreground/50 transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground"
          aria-hidden
        />
      </div>

      <div className="relative h-[7.5rem] w-full overflow-hidden sm:h-[42%] sm:min-h-[96px]">
        {preview}
      </div>

      <span className="space-y-1.5">
        <span className="block text-[0.95rem] font-semibold tracking-tight text-foreground sm:text-base">
          {label}
        </span>
        <span className="block text-[13px] leading-snug font-normal whitespace-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </Button>
  )
}
