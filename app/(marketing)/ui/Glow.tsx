import { cn } from "@/lib/utils"

/**
 * Halo violeta difuso del fondo. Es decoración pura: no aporta contenido ni
 * recibe foco, así que va fuera del flujo y oculto para lectores de pantalla.
 *
 * El ancestro que lo posiciona tiene que ser `relative isolate`: sin contexto de
 * apilado propio, el `-z-10` lo manda detrás del fondo blanco y no se ve.
 */
export function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 rounded-full blur-[100px]", className)}
    />
  )
}
