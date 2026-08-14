import { cn } from "@/lib/utils"

/** Superficie base de todas las tarjetas del landing: borde tenue y sombra corta. */
export const cardSurface = cn(
  "rounded-2xl border border-black/[0.06] bg-white",
  "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-16px_rgba(0,0,0,0.12)]",
)

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(cardSurface, className)}>{children}</div>
}
