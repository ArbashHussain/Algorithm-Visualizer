import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MenuItemProps = {
  to: string
  label: string
  description: string
  icon: LucideIcon
  className?: string
}

export default function MenuItem({
  to,
  label,
  description,
  icon: Icon,
  className,
}: MenuItemProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link to={to} />}
      variant="outline"
      className={cn(
        "aspect-square h-auto min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-none border-border bg-background p-6 text-center shadow-none transition-colors duration-200 hover:z-10 hover:bg-muted hover:text-foreground focus-visible:z-10 -ml-px first:ml-0 dark:bg-background dark:hover:bg-muted",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-none bg-primary text-primary-foreground transition-colors duration-200 group-hover/button:bg-foreground">
        <Icon className="size-5" />
      </span>
      <span className="space-y-1">
        <span className="block text-base font-semibold tracking-tight text-foreground">
          {label}
        </span>
        <span className="block text-sm font-normal whitespace-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </Button>
  )
}
