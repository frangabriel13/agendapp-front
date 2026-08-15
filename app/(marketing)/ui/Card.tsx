import { cardSurface } from "@/components/surface"
import { cn } from "@/lib/utils"

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(cardSurface, className)}>{children}</div>
}
