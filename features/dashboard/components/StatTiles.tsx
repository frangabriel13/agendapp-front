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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className={cn(cardSurface, "relative isolate overflow-hidden p-5")}>
          {/* El mismo halo del landing, en tamaño de tarjeta: le da fondo al
              número sin meter una segunda superficie. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-8 -z-10 size-24 rounded-full bg-violet-100/60 blur-2xl"
          />
          <span
            aria-hidden
            className="mb-4 flex size-9 items-center justify-center rounded-xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white"
          >
            <Icon size={17} className="text-violet-600" />
          </span>
          <p className="text-[26px] leading-none font-semibold tracking-tight text-neutral-900">{value}</p>
          <p className="mt-2.5 text-[13px] font-medium text-neutral-700">{label}</p>
          {/* Sin truncar: en dos columnas angostas la aclaración se corta justo
              donde dice lo que importa. Que baje de línea. */}
          <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
        </div>
      ))}
    </div>
  )
}
