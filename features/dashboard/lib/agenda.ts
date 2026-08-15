import { timeToMinutes } from "@/lib/time"
import type { Appointment } from "@/types"

/**
 * El turno que sigue: el primero que todavía no terminó.
 *
 * Se mira el fin y no el inicio a propósito: el que está siendo atendido ahora
 * mismo es el que le importa a quien mira el panel, no el próximo de la lista.
 * `-1` cuando ya terminaron todos.
 */
export function nextUpIndex(appointments: Appointment[], now: string): number {
  const minutes = timeToMinutes(now)
  return appointments.findIndex((appointment) => timeToMinutes(appointment.endTime) > minutes)
}

/** Lo que dice el chip del turno destacado. */
export function nextUpLabel(appointment: Appointment, now: string): string {
  const minutes = timeToMinutes(now)
  const start = timeToMinutes(appointment.startTime)

  if (minutes >= start) return "En curso"

  const falta = start - minutes
  // Más de una hora antes, "en 180 min" no le dice nada a nadie: la hora sí.
  return falta < 60 ? `En ${falta} min` : `A las ${appointment.startTime}`
}
