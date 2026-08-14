import { WEEK_DAYS, dayOrder } from "@/lib/days"
import { timeToMinutes } from "@/lib/time"
import type { EmployeeShift, EmployeeShiftInput } from "@/types"

/**
 * Un tramo mientras se edita.
 *
 * Lleva `key` propia en vez de reusar el `id` del backend porque los tramos
 * nuevos todavía no tienen id, y React necesita una clave estable para no
 * remontar la fila —y perder el foco— en cada tecla.
 */
export interface DraftShift extends EmployeeShiftInput {
  key: string
}

let counter = 0

export function newShift(dayOfWeek: number, branchId = ""): DraftShift {
  counter += 1
  return { key: `nuevo-${counter}`, dayOfWeek, branchId, startsAt: "09:00", endsAt: "13:00" }
}

/** Los tramos leídos traen `id`; el editor trabaja con `key`. */
export function toDrafts(shifts: EmployeeShift[]): DraftShift[] {
  return shifts.map(({ id, branchId, dayOfWeek, startsAt, endsAt }) => ({
    key: id,
    branchId,
    dayOfWeek,
    startsAt,
    endsAt,
  }))
}

/**
 * Deja los tramos como los quiere el PUT: sin `key` y ordenados.
 *
 * El `id` de lectura no se reenvía nunca — `EmployeeShiftDto` no lo tiene y el
 * backend rechaza los campos de más con un 400.
 */
export function toPayload(drafts: DraftShift[]): EmployeeShiftInput[] {
  return sortShifts(drafts).map(({ branchId, dayOfWeek, startsAt, endsAt }) => ({
    branchId,
    dayOfWeek,
    startsAt,
    endsAt,
  }))
}

/** Semana en orden de lectura: lunes primero, y dentro del día por hora. */
export function sortShifts<T extends { dayOfWeek: number; startsAt: string }>(shifts: T[]): T[] {
  return [...shifts].sort(
    (a, b) => dayOrder(a.dayOfWeek) - dayOrder(b.dayOfWeek) || timeToMinutes(a.startsAt) - timeToMinutes(b.startsAt),
  )
}

export function shiftsOfDay(drafts: DraftShift[], dayOfWeek: number): DraftShift[] {
  return sortShifts(drafts.filter((s) => s.dayOfWeek === dayOfWeek))
}

/**
 * Errores por tramo, indexados por `key`.
 *
 * Sobre los solapamientos: se marcan aunque sean de sucursales distintas. Una
 * persona no puede estar en dos locales a la vez, y si se permitiera, la agenda
 * la daría por disponible en ambos.
 */
export function validateShifts(drafts: DraftShift[], allowedBranchIds: string[]): Map<string, string> {
  const errors = new Map<string, string>()

  for (const shift of drafts) {
    if (!shift.branchId) {
      errors.set(shift.key, "Elegí una sucursal")
      continue
    }
    if (!allowedBranchIds.includes(shift.branchId)) {
      errors.set(shift.key, "No trabaja en esa sucursal")
      continue
    }
    if (!shift.startsAt || !shift.endsAt) {
      errors.set(shift.key, "Completá las dos horas")
      continue
    }
    if (timeToMinutes(shift.endsAt) <= timeToMinutes(shift.startsAt)) {
      errors.set(shift.key, "El fin tiene que ser posterior al inicio")
    }
  }

  for (const day of WEEK_DAYS) {
    const ofDay = shiftsOfDay(drafts, day.value).filter((s) => !errors.has(s.key))
    for (let i = 1; i < ofDay.length; i++) {
      const previous = ofDay[i - 1]!
      const current = ofDay[i]!
      // Tocarse no es superponerse: 09:00–13:00 y 13:00–17:00 conviven.
      if (timeToMinutes(current.startsAt) < timeToMinutes(previous.endsAt)) {
        errors.set(current.key, "Se superpone con otro tramo del mismo día")
      }
    }
  }

  return errors
}

/** Minutos semanales, para mostrar cuánto suma la semana. */
export function weeklyMinutes(drafts: DraftShift[]): number {
  return drafts.reduce((total, shift) => {
    const minutes = timeToMinutes(shift.endsAt) - timeToMinutes(shift.startsAt)
    return total + (Number.isFinite(minutes) && minutes > 0 ? minutes : 0)
  }, 0)
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
