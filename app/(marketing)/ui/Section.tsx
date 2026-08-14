import { cn } from "@/lib/utils"

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
} as const

interface Props {
  id?: string
  width?: keyof typeof WIDTHS
  /** Sombreado suave para alternar el ritmo entre secciones. */
  muted?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Envoltorio de sección: ancho, aire vertical y el `scroll-mt` que evita que el
 * nav fijo tape el título cuando se llega por un ancla del menú.
 */
export function Section({ id, width = "default", muted = false, className, children }: Props) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate scroll-mt-28 px-6 py-20 md:py-28",
        muted && "bg-neutral-50/70",
        className,
      )}
    >
      <div className={cn("mx-auto", WIDTHS[width])}>{children}</div>
    </section>
  )
}
