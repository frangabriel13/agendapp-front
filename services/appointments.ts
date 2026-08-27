import { apiFetch } from "@/lib/api"
import { splitInstant } from "@/lib/time"
import type {
  ApiAppointment,
  Appointment,
  AppointmentStatus,
  Availability,
  ChangeStatusResult,
  CreateAppointmentPayload,
  CreateRecurringPayload,
  RecurringResult,
} from "@/types"

/**
 * El turno de la API, con el día y las horas de pared agregados.
 *
 * **Es el único lugar donde se convierte un instante a hora de reloj.** Todo lo
 * que dibuja el calendario trabaja en horas de pared —es lo que es una grilla—,
 * y hacer la cuenta en cada componente es cómo se cuelan los errores de zona.
 */
export function toAppointment(raw: ApiAppointment): Appointment {
  const inicio = splitInstant(raw.startsAt)
  const fin = splitInstant(raw.endsAt)

  return { ...raw, day: inicio.day, startTime: inicio.time, endTime: fin.time }
}

export interface AppointmentRange {
  /** "YYYY-MM-DD", incluido. */
  from: string
  /** "YYYY-MM-DD", incluido. Hasta 92 días de diferencia. */
  to: string
  branchId?: string
  employeeId?: string
  customerId?: string
  status?: AppointmentStatus[]
}

/**
 * La agenda de un rango de días. **No está paginada**: va por rango, hasta 92
 * días.
 *
 * Un turno que arranca el día anterior y termina dentro del rango **también
 * viene**, así que la pantalla no puede asumir que todo lo que llega empieza
 * dentro del rango que pidió.
 */
export function listAppointmentsRequest(range: AppointmentRange): Promise<Appointment[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to })
  if (range.branchId) params.set("branchId", range.branchId)
  if (range.employeeId) params.set("employeeId", range.employeeId)
  if (range.customerId) params.set("customerId", range.customerId)
  // `status` es repetible: se manda una vez por cada uno.
  for (const status of range.status ?? []) params.append("status", status)

  return apiFetch<ApiAppointment[]>(`/appointments?${params}`).then((turnos) =>
    turnos.map(toAppointment),
  )
}

export function getAppointmentRequest(id: string): Promise<Appointment> {
  return apiFetch<ApiAppointment>(`/appointments/${id}`).then(toAppointment)
}

/**
 * Los huecos reservables de un día.
 *
 * Ya tiene restado todo: horario del local, horario del profesional, ausencias,
 * turnos tomados y recursos ocupados. Cuatro cosas que sorprenden:
 *
 * 1. **Los slots duran `duración + buffer`**, así que el último turno del día
 *    termina antes del cierre. No es un bug
 * 2. **Sin `employeeId` vienen todos** los que prestan ese servicio ahí, y cada
 *    slot dice quiénes lo tienen libre
 * 3. **`branchClosed` distingue "cerrado" de "sin lugar"**: los dos devuelven
 *    `slots: []` pero el cartel que corresponde es distinto
 * 4. **No recorta los slots que ya pasaron**: describe lo que el horario permite,
 *    no lo que todavía se puede reservar. Filtrar por `startsAt > ahora` es
 *    responsabilidad de la pantalla
 */
export function getAvailabilityRequest(query: {
  branchId: string
  serviceId: string
  date: string
  employeeId?: string
}): Promise<Availability> {
  const params = new URLSearchParams({
    branchId: query.branchId,
    serviceId: query.serviceId,
    date: query.date,
  })
  if (query.employeeId) params.set("employeeId", query.employeeId)

  return apiFetch<Availability>(`/appointments/availability?${params}`)
}

/**
 * Agenda un turno.
 *
 * **Acepta cualquier `startsAt` que entre en el tiempo libre**, no hace falta un
 * slot exacto de la lista: se puede cargar a las 09:07 para alguien que llegó sin
 * turno. El `endsAt` lo calcula el servidor sumando duración y buffer de cada
 * servicio.
 *
 * Dos errores que **no son fallas de la app**:
 * - **409**: alguien tomó el hueco primero. Lo correcto es refrescar la
 *   disponibilidad y ofrecer otro horario, **no reintentar**
 * - **402**: el negocio debe la suscripción. Es 402 y no 403 justamente para
 *   poder distinguirlo de un problema de permisos
 */
export function createAppointmentRequest(
  payload: CreateAppointmentPayload,
): Promise<Appointment> {
  return apiFetch<ApiAppointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(toAppointment)
}

/**
 * Agenda una serie de turnos repetidos.
 *
 * **Las fechas que no entran se saltean, no tumban la serie.** Un feriado o un
 * hueco ya tomado vuelve en `skipped` con el motivo y el resto se crea igual: por
 * eso la pantalla **tiene que mostrar esa lista**, o quien agendó se va creyendo
 * que quedaron los seis turnos cuando quedaron cuatro.
 *
 * Si no entró **ninguna**, ahí sí es 409.
 */
export function createRecurringRequest(payload: CreateRecurringPayload): Promise<RecurringResult> {
  return apiFetch<RecurringResult>("/appointments/recurring", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Mueve el estado. Una transición inválida devuelve **409, no 400**.
 *
 * **Al cancelar, la respuesta trae `refund`** con qué corresponde devolver según
 * la política del negocio. No mueve plata: es para decirle algo concreto a la
 * clienta en el momento. Se devuelve tipada en vez de tirarla, que es lo que se
 * hacía antes.
 *
 * Ojo con el orden que impone el backend: para cuando llega esta respuesta el
 * turno **ya está cancelado y no acepta movimientos** —ni siquiera un `REFUND`—,
 * así que este número sirve para devolver por fuera, no para registrarlo acá.
 */
export function changeStatusRequest(
  id: string,
  status: AppointmentStatus,
  reason?: string,
): Promise<ChangeStatusResult> {
  return apiFetch<ChangeStatusResult>(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(reason ? { cancellationReason: reason } : {}) }),
  })
}

/** `PATCH /appointments/:id` **solo edita `notes`**: mover el horario es reprogramar. */
export function updateNotesRequest(id: string, notes: string | null): Promise<Appointment> {
  return apiFetch<ApiAppointment>(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  }).then(toAppointment)
}

/**
 * Reprograma: devuelve **el turno nuevo** (201).
 *
 * El viejo queda en `RESCHEDULED` y los dos enlazados por `rescheduledFromId` /
 * `rescheduledToId`. No se edita el original a propósito: así el historial dice
 * que hubo un cambio. Los servicios se copian con el precio que tenían.
 *
 * **La plata no se muda.** Lo cobrado queda asentado en el turno viejo, que a
 * partir de acá no acepta movimientos —el mismo 409 que un cancelado—. Quien
 * reprograma un turno con seña tiene que saberlo.
 */
export function rescheduleRequest(
  id: string,
  startsAt: string,
  employeeId?: string,
): Promise<Appointment> {
  return apiFetch<ApiAppointment>(`/appointments/${id}/reschedule`, {
    method: "POST",
    // `employeeId` se **omite** si no cambia: mandarlo igual no rompe, pero el
    // backend corre con `forbidNonWhitelisted` y la costumbre de mandar solo lo
    // que cambió es la que evita los 400 en el resto de la app.
    body: JSON.stringify({ startsAt, ...(employeeId ? { employeeId } : {}) }),
  }).then(toAppointment)
}
