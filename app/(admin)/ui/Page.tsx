import { cn } from "@/lib/utils"

const WIDTHS = {
  /** Formularios largos: más angosto se lee mejor y no quedan campos gigantes. */
  narrow: "max-w-3xl p-5 sm:p-8",
  /** Listas. */
  default: "max-w-5xl p-5 sm:p-8",
  /** Grillas de varias columnas. */
  wide: "max-w-6xl p-5 sm:p-8",
  /**
   * Todo el ancho y **sin padding propio**. Para tableros: un calendario de
   * catorce columnas dentro de una columna centrada se aprieta al pedo.
   *
   * El aire lo pone el shell con su `gap`/`p`, y por eso las tarjetas quedan
   * alineadas al pixel con la barra de arriba. Si esta variante trajera padding,
   * el contenido quedaría metido para adentro respecto de la barra.
   */
  full: "max-w-none",
} as const

interface PageProps {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}

/**
 * Contenedor de las páginas del panel.
 *
 * Centra la columna en vez de pegarla a la izquierda: en un monitor ancho, el
 * contenido pegado a un costado deja un vacío que parece un error de maquetado.
 */
export function Page({ width = "default", className, children }: PageProps) {
  return <div className={cn("mx-auto w-full", WIDTHS[width], className)}>{children}</div>
}

interface HeaderProps {
  title: string
  description: string
  /** Chip al lado del título, para aclarar algo del estado de la pantalla. */
  badge?: React.ReactNode
  /** Acción principal de la pantalla, alineada a la derecha. */
  action?: React.ReactNode
}

/** Título, bajada y acción. Se repetía igual en todas las pantallas del panel. */
export function PageHeader({ title, description, badge, action }: HeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {badge}
        </div>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      {action}
    </div>
  )
}
