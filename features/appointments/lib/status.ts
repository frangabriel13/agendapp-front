import type { AppointmentStatus } from "@/types"

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  // "A confirmar" y no "Pendiente": nombra lo que hay que hacer con el turno, no
  // el casillero en el que está. Lo leen el filtro de la agenda, el tablero del
  // día, el modal y la lista de Inicio, así que el nombre es uno solo.
  pending: "A confirmar",
  confirmed: "Confirmado",
  completed: "Atendido",
  cancelled: "Cancelado",
  no_show: "No asistió",
}

/**
 * Los mismos nombres para encabezar un grupo.
 *
 * Van escritos y no armados con una "s": en castellano "a confirmar" ya vale
 * para varios y "A confirmars" es lo que sale de pluralizar a mano.
 */
export const STATUS_PLURAL: Record<AppointmentStatus, string> = {
  pending: "A confirmar",
  confirmed: "Confirmados",
  completed: "Atendidos",
  cancelled: "Cancelados",
  no_show: "No asistieron",
}

// Bloque del turno dentro del calendario semanal
export const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 border-emerald-400 text-emerald-900",
  pending: "bg-amber-100 border-amber-400 text-amber-900",
  completed: "bg-slate-100 border-slate-400 text-slate-600",
  cancelled: "bg-red-100 border-red-400 text-red-900 line-through opacity-60",
  no_show: "bg-red-50 border-red-300 text-red-700 opacity-60",
}

// Badge de estado (modal / filtros)
export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  completed: "bg-slate-100 text-slate-600 border-slate-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  no_show: "bg-red-50 text-red-600 border-red-200",
}

export const STATUS_ORDER: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]
