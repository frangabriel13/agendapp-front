import { WEEK_DAYS, dayOrder } from "@/lib/days"
import { timeToMinutes } from "@/lib/time"
import type { BusinessHour, BusinessHourInput } from "@/types"

export interface DayDraft {
  dayOfWeek: number
  isClosed: boolean
  opensAt: string
  closesAt: string
}

const DEFAULT_OPEN = "09:00"
const DEFAULT_CLOSE = "18:00"

/**
 * Los siete días siempre, en orden de lectura.
 *
 * Un día cerrado llega con las horas en `null`; acá se rellenan con valores por
 * defecto para que el input tenga algo si lo reabren. Eso no se manda: `toPayload`
 * las descarta cuando el día está cerrado.
 */
export function toDrafts(hours: BusinessHour[]): DayDraft[] {
  const byDay = new Map(hours.map((hour) => [hour.dayOfWeek, hour]))

  return WEEK_DAYS.map((day) => {
    const hour = byDay.get(day.value)
    return {
      dayOfWeek: day.value,
      // Un día que el backend no mandó se toma como cerrado, no como abierto.
      isClosed: hour ? hour.isClosed : true,
      opensAt: hour?.opensAt ?? DEFAULT_OPEN,
      closesAt: hour?.closesAt ?? DEFAULT_CLOSE,
    }
  })
}

/**
 * **Acá está el detalle que rompe.** Un día cerrado va sin `opensAt` ni
 * `closesAt`: en la lectura esos campos vienen en `null`, pero mandar `null` al
 * escribir es un 400. Hay que omitirlos.
 *
 * Manda los siete días porque el backend los exige completos y sin repetir.
 */
export function toPayload(drafts: DayDraft[]): BusinessHourInput[] {
  return [...drafts]
    .sort((a, b) => dayOrder(a.dayOfWeek) - dayOrder(b.dayOfWeek))
    .map((day) =>
      day.isClosed
        ? { dayOfWeek: day.dayOfWeek, isClosed: true }
        : { dayOfWeek: day.dayOfWeek, isClosed: false, opensAt: day.opensAt, closesAt: day.closesAt },
    )
}

/** Errores por día, indexados por `dayOfWeek`. Un día cerrado nunca falla. */
export function validateHours(drafts: DayDraft[]): Map<number, string> {
  const errors = new Map<number, string>()

  for (const day of drafts) {
    if (day.isClosed) continue
    if (!day.opensAt || !day.closesAt) {
      errors.set(day.dayOfWeek, "Completá las dos horas")
      continue
    }
    if (timeToMinutes(day.closesAt) <= timeToMinutes(day.opensAt)) {
      errors.set(day.dayOfWeek, "El cierre tiene que ser posterior a la apertura")
    }
  }

  return errors
}

/**
 * Resumen corto para el listado: agrupa los días seguidos que abren igual.
 * "Lun a Vie 09:00–18:00 · Sáb 09:00–13:00".
 */
export function summarize(hours: BusinessHour[]): string {
  const abiertos = toDrafts(hours).map((day) => (day.isClosed ? null : day))
  const tramos: string[] = []

  let i = 0
  while (i < abiertos.length) {
    const actual = abiertos[i]
    if (!actual) {
      i += 1
      continue
    }
    let fin = i
    while (
      fin + 1 < abiertos.length &&
      abiertos[fin + 1]?.opensAt === actual.opensAt &&
      abiertos[fin + 1]?.closesAt === actual.closesAt
    ) {
      fin += 1
    }
    const desde = WEEK_DAYS[i]!.short
    const hasta = WEEK_DAYS[fin]!.short
    const dias = fin > i ? `${desde} a ${hasta}` : desde
    tramos.push(`${dias} ${actual.opensAt}–${actual.closesAt}`)
    i = fin + 1
  }

  return tramos.length > 0 ? tramos.join(" · ") : "Cerrada toda la semana"
}
