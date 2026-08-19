import type { BusinessHour, SpecialDay } from "@/types"
import type { TimelineDay } from "./timeline"

export interface ClosedDay {
  /** Qué lo cierra: la semana comercial de siempre, o un día especial cargado. */
  motivo: "horario" | "especial"
  /** El nombre del día especial, cuando lo tiene. */
  nombre?: string
}

/**
 * Los días en que **no abre ninguna sucursal**.
 *
 * Es un dato de la columna, no de la persona: el rayado gris dice que el negocio
 * está cerrado, y por eso se mide contra todas las sucursales juntas. Que alguien
 * no trabaje ese día es otra cosa y se dibuja en su celda.
 *
 * Con una sola sucursal sin horarios cargados —o mientras cargan— devuelve vacío
 * en vez de rayar la quincena entera: es la diferencia entre "cerramos" y
 * "todavía no nos dijiste cuándo abrís".
 */
export function closedDays(
  days: TimelineDay[],
  hours: Map<string, BusinessHour[]>,
  special: Map<string, SpecialDay[]>,
): Map<string, ClosedDay> {
  const sucursales = [...hours.entries()].filter(([, semana]) => semana.length > 0)
  if (sucursales.length === 0) return new Map()

  const cerrados = new Map<string, ClosedDay>()

  for (const day of days) {
    let abreAlguna = false
    let porEspecial: SpecialDay | undefined

    for (const [branchId, semana] of sucursales) {
      // Un día especial pisa a la semana comercial: puede cerrar un día que
      // normalmente abre, o abrir con otro horario uno que normalmente cierra.
      const especial = special.get(branchId)?.find((d) => d.date === day.key)

      if (especial) {
        if (especial.isClosed) porEspecial ??= especial
        else abreAlguna = true
        continue
      }

      if (semana.some((h) => h.dayOfWeek === day.dayOfWeek && !h.isClosed)) abreAlguna = true
    }

    if (abreAlguna) continue

    cerrados.set(
      day.key,
      porEspecial
        ? { motivo: "especial", ...(porEspecial.description ? { nombre: porEspecial.description } : {}) }
        : { motivo: "horario" },
    )
  }

  return cerrados
}
