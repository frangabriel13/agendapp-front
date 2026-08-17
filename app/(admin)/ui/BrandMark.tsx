import Link from "next/link"
import { CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * La marca en formato cuadrado.
 *
 * El logo del landing es 1024×312: en un riel de 68px de ancho no entra sin
 * quedar ilegible. Este es el mismo símbolo —calendario con tilde— y el mismo
 * degradado violeta a rosa, en la proporción que el riel necesita.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      aria-label="reservApp — ir al inicio"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl text-white",
        "bg-gradient-to-br from-violet-600 to-pink-500",
        "shadow-[0_6px_16px_-8px_rgba(124,58,237,0.65)]",
        "transition-transform hover:scale-105",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
        className,
      )}
    >
      <CalendarCheck size={20} aria-hidden />
    </Link>
  )
}
