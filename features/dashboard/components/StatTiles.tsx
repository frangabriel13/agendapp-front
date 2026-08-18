import type { LucideIcon } from "lucide-react"
import { cardSurface } from "@/components/surface"
import { cn } from "@/lib/utils"

export interface Stat {
  label: string
  value: string
  /** Segunda línea: el dato solo no dice si está bien o mal. */
  hint: string
  icon: LucideIcon
}

/** La fila de números de arriba del panel. */
export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }) => (
        /* En fila y no en columna: a todo el ancho, un número chico arriba a la
           izquierda de una tarjeta de 450px deja un vacío enorme. */
        <div
          key={label}
          className={cn(
            cardSurface,
            "relative isolate flex overflow-hidden p-5",
            // En un teléfono, con dos columnas, el ícono al costado deja el
            // texto en una franja de 100px y el monto no entra.
            "flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
          )}
        >
          {/* El mismo halo del landing, en tamaño de tarjeta: le da fondo al
              número sin meter una segunda superficie. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-8 -z-10 size-24 rounded-full bg-violet-100/60 blur-2xl"
          />
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white"
          >
            <Icon size={19} className="text-violet-600" />
          </span>
          <div className="min-w-0">
            <p className="text-[21px] leading-none font-semibold tracking-tight text-neutral-900 sm:text-[24px]">
              {value}
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-neutral-700">{label}</p>
            {/* Sin truncar: en dos columnas angostas la aclaración se corta
                justo donde dice lo que importa. Que baje de línea. */}
            <p className="text-xs text-neutral-400">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
