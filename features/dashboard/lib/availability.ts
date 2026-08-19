import { timeToMinutes } from "@/lib/time"
import type { Appointment, EmployeeShift } from "@/types"

/**
 * Qué tiene una persona un día.
 *
 * `sin-horario` no es lo mismo que `no-trabaja`: el primero dice que nadie le
 * cargó los horarios todavía —y es una tarea pendiente—, el segundo que ese día
 * no le toca. Confundirlos haría que un equipo a medio configurar se viera como
 * un equipo que no trabaja nunca.
 */
export type DayStatus = "sin-horario" | "no-trabaja" | "vacia" | "disponible" | "llena"

/**
 * Con menos de este resto libre, el día se da por lleno.
 *
 * Que sobren veinte minutos sueltos no significa que entre otra clienta: casi
 * ningún servicio dura tan poco. **Cuando el front consuma los servicios de la
 * Fase 3, la regla buena es "no entra ni el más corto"** y esta constante se va.
 */
const RESTO_MINIMO = 0.15

/** Minutos de trabajo por día de semana. `dayOfWeek` es 0 = domingo. */
export function minutesByWeekday(shifts: EmployeeShift[]): Map<number, number> {
  const porDia = new Map<number, number>()

  for (const shift of shifts) {
    const duracion = timeToMinutes(shift.endsAt) - timeToMinutes(shift.startsAt)
    if (duracion <= 0) continue
    porDia.set(shift.dayOfWeek, (porDia.get(shift.dayOfWeek) ?? 0) + duracion)
  }

  return porDia
}

/**
 * Minutos ocupados por día, por clave "YYYY-MM-DD".
 *
 * Los cancelados no ocupan nada: ese lugar volvió a estar libre. Los "no asistió"
 * sí, porque nadie más pudo tomar ese horario.
 */
export function bookedMinutesByDay(appointments: Appointment[]): Map<string, number> {
  const porDia = new Map<string, number>()

  for (const appointment of appointments) {
    if (appointment.status === "cancelled") continue
    const duracion = timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)
    if (duracion <= 0) continue
    porDia.set(appointment.date, (porDia.get(appointment.date) ?? 0) + duracion)
  }

  return porDia
}

export interface DayInput {
  /** Minutos que la persona trabaja ese día de la semana. */
  capacidad: number
  /** Minutos ya tomados por turnos. */
  ocupado: number
  /** `false` cuando la persona no tiene ningún horario cargado. */
  tieneHorarios: boolean
}

export function dayStatus({ capacidad, ocupado, tieneHorarios }: DayInput): DayStatus {
  if (!tieneHorarios) return "sin-horario"
  if (capacidad <= 0) return "no-trabaja"
  if (ocupado <= 0) return "vacia"
  return capacidad - ocupado <= capacidad * RESTO_MINIMO ? "llena" : "disponible"
}

export const STATUS_LABEL: Record<DayStatus, string> = {
  "sin-horario": "Sin horario",
  "no-trabaja": "No trabaja",
  vacia: "Vacía",
  disponible: "Disponible",
  llena: "Llena",
}
