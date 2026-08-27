import { splitInstant, toInstant as aInstante } from "@/lib/time"
import type { CreateTimeOffPayload, TimeOff } from "@/types"

/** Lo que se edita en el formulario, en horas de pared. */
export interface TimeOffDraft {
  allDay: boolean
  /** "YYYY-MM-DD" */
  startDate: string
  /** "HH:MM" */
  startTime: string
  endDate: string
  endTime: string
  /** "" = en ninguna sucursal en particular (vacaciones). */
  branchId: string
  reason: string
}

/**
 * Fecha y hora **del negocio** a instante ISO.
 *
 * La persona escribe hora de pared —"el 20 a las 9"— pero la API guarda un
 * instante absoluto. **Es la misma conversión que la de los turnos**, así que sale
 * de `lib/time.ts` y no de una copia acá: la copia usaba la zona del navegador y
 * cargaba las ausencias corridas cuando esa zona no era la del negocio.
 */
export { toInstant } from "@/lib/time"

/** "YYYY-MM-DD" de un instante, en el día del negocio. */
export function toDateInput(iso: string): string {
  return splitInstant(iso).day
}

/** "HH:MM" de un instante, en la hora del negocio. */
export function toTimeInput(iso: string): string {
  return splitInstant(iso).time
}

/**
 * Una ausencia de día completo se guarda de 00:00 a 23:59 **del negocio**. No hay
 * un campo `allDay` en la API, así que se deduce de las horas al releerla.
 */
export function isAllDay(startsAt: string, endsAt: string): boolean {
  return toTimeInput(startsAt) === "00:00" && toTimeInput(endsAt) === "23:59"
}

export function draftToPayload(draft: TimeOffDraft): CreateTimeOffPayload {
  const startsAt = aInstante(draft.startDate, draft.allDay ? "00:00" : draft.startTime)
  const endsAt = aInstante(draft.endDate, draft.allDay ? "23:59" : draft.endTime)

  return {
    startsAt,
    endsAt,
    // El backend rechaza los campos de más, así que los opcionales vacíos se
    // omiten en vez de mandarse en "" o null.
    ...(draft.branchId ? { branchId: draft.branchId } : {}),
    ...(draft.reason.trim() ? { reason: draft.reason.trim() } : {}),
  }
}

export function validateDraft(draft: TimeOffDraft): string | null {
  if (!draft.startDate || !draft.endDate) return "Completá las dos fechas"
  if (!draft.allDay && (!draft.startTime || !draft.endTime)) return "Completá las dos horas"

  const start = new Date(draftToPayload(draft).startsAt).getTime()
  const end = new Date(draftToPayload(draft).endsAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Las fechas no son válidas"
  if (end <= start) return "El fin tiene que ser posterior al inicio"

  return null
}

/** ¿Esta ausencia ya pasó? Sirve para separar lo vigente de lo histórico. */
export function isPast(timeOff: Pick<TimeOff, "endsAt">, now = new Date()): boolean {
  return new Date(timeOff.endsAt).getTime() < now.getTime()
}

const DAY = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
const TIME = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })

/** Texto corto del rango, evitando repetir el día cuando empieza y termina igual. */
export function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const sameDay = toDateInput(startsAt) === toDateInput(endsAt)
  const allDay = isAllDay(startsAt, endsAt)

  if (sameDay) {
    return allDay
      ? `${DAY.format(start)} · todo el día`
      : `${DAY.format(start)} · ${TIME.format(start)} a ${TIME.format(end)}`
  }

  return allDay
    ? `${DAY.format(start)} al ${DAY.format(end)} · todo el día`
    : `${DAY.format(start)} ${TIME.format(start)} → ${DAY.format(end)} ${TIME.format(end)}`
}

/** Vigentes primero y más próximas arriba; las pasadas, al final. */
export function sortTimeOff(items: TimeOff[], now = new Date()): TimeOff[] {
  return [...items].sort((a, b) => {
    const pastA = isPast(a, now)
    const pastB = isPast(b, now)
    if (pastA !== pastB) return pastA ? 1 : -1
    const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    // Las pasadas se leen mejor de la más reciente a la más vieja.
    return pastA ? -diff : diff
  })
}
