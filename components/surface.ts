import { cn } from "@/lib/utils"

/**
 * Superficie base de todas las tarjetas: borde tenue y sombra corta.
 *
 * Vive fuera de `(marketing)` y de `(admin)` a propósito. Es lo que hace que el
 * panel se vea como la página principal; si cada lado tuviera su propia versión,
 * se separarían al primer retoque y volveríamos a tener dos vocabularios.
 */
export const cardSurface = cn(
  "rounded-2xl border border-black/[0.06] bg-white",
  "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-16px_rgba(0,0,0,0.12)]",
)
