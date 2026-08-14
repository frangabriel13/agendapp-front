import { timeToMinutes } from "@/lib/time"
import type { SpecialDay } from "@/types"

/**
 * Convierte "YYYY-MM-DD" a una fecha local.
 *
 * **No usar `new Date("2026-12-25")`**: la spec obliga a interpretar ese formato
 * como UTC, así que en una zona negativa —toda América— se corre un día para
 * atrás y el 25 se muestra como 24. Armando la fecha por partes se interpreta en
 * la zona local, que es lo que representa un día de calendario.
 */
export function parseCalendarDay(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}

const FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "long" })

export function formatCalendarDay(date: string): string {
  return FORMATTER.format(parseCalendarDay(date))
}

/** Los más próximos primero; lo ya pasado al final. */
export function sortSpecialDays(days: SpecialDay[], today = new Date()): SpecialDay[] {
  const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  return [...days].sort((a, b) => {
    const fechaA = parseCalendarDay(a.date).getTime()
    const fechaB = parseCalendarDay(b.date).getTime()
    const pasadoA = fechaA < hoy
    const pasadoB = fechaB < hoy
    if (pasadoA !== pasadoB) return pasadoA ? 1 : -1
    // Entre los pasados se lee mejor del más reciente al más viejo.
    return pasadoA ? fechaB - fechaA : fechaA - fechaB
  })
}

export function isPastDay(date: string, today = new Date()): boolean {
  const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return parseCalendarDay(date).getTime() < hoy
}

export interface SpecialDayDraft {
  date: string
  isClosed: boolean
  opensAt: string
  closesAt: string
  description: string
}

export function validateSpecialDay(draft: SpecialDayDraft): string | null {
  if (!draft.date) return "Elegí una fecha"
  if (draft.isClosed) return null
  if (!draft.opensAt || !draft.closesAt) return "Completá las dos horas"
  if (timeToMinutes(draft.closesAt) <= timeToMinutes(draft.opensAt)) {
    return "El cierre tiene que ser posterior a la apertura"
  }
  return null
}

/**
 * Un día cerrado va sin horas, igual que en la semana comercial: mandarlas
 * cuando `isClosed` es true no tiene sentido y el backend las rechaza.
 */
export function draftToPayload(draft: SpecialDayDraft) {
  return {
    date: draft.date,
    isClosed: draft.isClosed,
    ...(draft.isClosed ? {} : { opensAt: draft.opensAt, closesAt: draft.closesAt }),
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
  }
}
