import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { cn } from "@/lib/utils"

/**
 * Píldora de la barra de un panel: el rango de fechas, un filtro, un "ver todo".
 *
 * Es el mismo botón redondeado que usan la landing y los CTA, pero en tamaño de
 * herramienta: lo que va al lado de un título, no lo que cierra una sección.
 */
export const pillClasses = cn(
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-3 py-1.5",
  "text-[12px] font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
)

/** La misma píldora, cuando además se puede tocar. */
export const pillLinkClasses = cn(
  pillClasses,
  "transition-colors hover:border-black/15 hover:text-neutral-900",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
)

/**
 * Tarjeta del panel.
 *
 * `section` y no `div`: cada tarjeta del tablero es un bloque de contenido con
 * su propio encabezado, y así el lector de pantalla puede saltar entre ellas.
 */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn(cardSurface, className)}>{children}</section>
}

interface PanelHeaderProps {
  title: string
  /**
   * `lg` para la tarjeta que encabeza una pantalla. El panel no tiene título de
   * página propio —la barra de arriba ya dice en qué sección estás—, así que el
   * título grande es el de la tarjeta principal.
   */
  size?: "md" | "lg"
  /** Chip al lado del título: un contador, un aviso de datos de ejemplo. */
  badge?: React.ReactNode
  /** Píldoras de la derecha. */
  action?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, size = "md", badge, action, className }: PanelHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <h2
          className={cn(
            "truncate font-semibold tracking-tight text-neutral-900",
            size === "lg" ? "text-xl sm:text-2xl" : "text-[15px]",
          )}
        >
          {title}
        </h2>
        {badge}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

/** El "ver todo" del encabezado, con la flecha que sale de la tarjeta. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={pillLinkClasses}>
      {children}
      <ArrowUpRight size={13} aria-hidden />
    </Link>
  )
}
