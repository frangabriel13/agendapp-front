import type { AppointmentStatus } from "@/types"

/**
 * Los siete estados de un turno, en castellano.
 *
 * **Son los del backend, no los cinco que tenía el mock.** Los dos cambios que
 * importan: hay **dos formas de cancelar** —quién canceló decide la política de
 * devolución, así que unificarlas perdería el dato— y `RESCHEDULED` no es una
 * baja: es el estado del turno *viejo*, que queda enlazado con el nuevo.
 */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  // "Falta la seña" y no "Pendiente": nombra lo que hay que hacer para que
  // avance, que es exactamente lo que significa PENDING_PAYMENT.
  PENDING_PAYMENT: "Falta la seña",
  CONFIRMED: "Confirmado",
  ATTENDED: "Atendido",
  NO_SHOW: "No asistió",
  CANCELED_BY_CUSTOMER: "Canceló el cliente",
  CANCELED_BY_BUSINESS: "Lo cancelamos",
  RESCHEDULED: "Reprogramado",
}

/**
 * Los mismos nombres para encabezar un grupo.
 *
 * Van escritos y no armados con una "s": en castellano "falta la seña" ya vale
 * para varios, y "Falta la señas" es lo que sale de pluralizar a mano.
 */
export const STATUS_PLURAL: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: "Falta la seña",
  CONFIRMED: "Confirmados",
  ATTENDED: "Atendidos",
  NO_SHOW: "No asistieron",
  CANCELED_BY_CUSTOMER: "Cancelados por el cliente",
  CANCELED_BY_BUSINESS: "Cancelados por el negocio",
  RESCHEDULED: "Reprogramados",
}

/** Badge de estado (modal / filtros). */
export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700 border-amber-300",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  ATTENDED: "bg-slate-100 text-slate-600 border-slate-300",
  NO_SHOW: "bg-red-50 text-red-600 border-red-200",
  CANCELED_BY_CUSTOMER: "bg-red-100 text-red-700 border-red-300",
  CANCELED_BY_BUSINESS: "bg-red-100 text-red-700 border-red-300",
  RESCHEDULED: "bg-sky-100 text-sky-700 border-sky-300",
}

/** El orden en que se leen: primero lo que hay que hacer, al final lo que no pasó. */
export const STATUS_ORDER: AppointmentStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "ATTENDED",
  "NO_SHOW",
  "CANCELED_BY_CUSTOMER",
  "CANCELED_BY_BUSINESS",
  "RESCHEDULED",
]

/**
 * ¿El turno ocupó (o va a ocupar) la hora?
 *
 * **`NO_SHOW` cuenta**: esa hora estuvo tomada aunque no haya venido nadie, y por
 * eso sigue dibujándose en el calendario. Las cancelaciones y el turno viejo de
 * una reprogramación liberaron el hueco, así que no.
 */
export function ocupaAgenda(status: AppointmentStatus): boolean {
  return status === "PENDING_PAYMENT" || status === "CONFIRMED" || status === "ATTENDED" || status === "NO_SHOW"
}

/** ¿Se canceló, de cualquiera de las dos formas? */
export function estaCancelado(status: AppointmentStatus): boolean {
  return status === "CANCELED_BY_CUSTOMER" || status === "CANCELED_BY_BUSINESS"
}

/**
 * ¿No ocurrió?
 *
 * Junta las dos cancelaciones, la ausencia y el turno viejo de una
 * reprogramación: para el tablero del día son la misma columna —"no pasó"—
 * aunque para la política de devoluciones no sean lo mismo.
 */
export function noOcurrio(status: AppointmentStatus): boolean {
  return estaCancelado(status) || status === "NO_SHOW" || status === "RESCHEDULED"
}

/**
 * Transiciones que el backend acepta. Una inválida devuelve **409, no 400**.
 *
 * `PATCH /appointments/:id/status` no deja volver atrás: de `ATTENDED` no se sale.
 * Tenerlas acá es lo que permite mostrar solo las acciones posibles en vez de
 * ofrecer todas y explicar el error después.
 */
export const TRANSICIONES: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELED_BY_CUSTOMER", "CANCELED_BY_BUSINESS"],
  CONFIRMED: ["ATTENDED", "NO_SHOW", "CANCELED_BY_CUSTOMER", "CANCELED_BY_BUSINESS"],
  ATTENDED: [],
  NO_SHOW: [],
  CANCELED_BY_CUSTOMER: [],
  CANCELED_BY_BUSINESS: [],
  RESCHEDULED: [],
}
