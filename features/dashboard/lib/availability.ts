import { timeToMinutes } from "@/lib/time"
import { toDateInput, toTimeInput } from "@/features/employees/lib/timeOff"
import { ocupaAgenda } from "@/features/appointments/lib/status"
import type { Appointment, EmployeeShift, TimeOff } from "@/types"
import type { TimelineDay } from "./timeline"

/** Minutos de un día. Una ausencia sin fin conocido llega hasta acá. */
const DIA_COMPLETO = 24 * 60

/**
 * Qué tiene una persona un día.
 *
 * `sin-horario` no es lo mismo que `no-trabaja`: el primero dice que nadie le
 * cargó los horarios todavía —y es una tarea pendiente—, el segundo que ese día
 * no le toca. Confundirlos haría que un equipo a medio configurar se viera como
 * un equipo que no trabaja nunca.
 */
export type DayStatus =
  | "sin-horario"
  | "no-trabaja"
  | "vacia"
  | "disponible"
  | "casi-llena"
  | "llena"

/**
 * Con menos de este resto libre, el día está *casi* lleno.
 *
 * Queda tiempo, pero no el suficiente para nadie: que sobren veinte minutos
 * sueltos no significa que entre otra clienta, porque casi ningún servicio dura
 * tan poco. Es distinto de `llena`, que es no tener un solo minuto.
 *
 * **Cuando el front consuma los servicios de la Fase 3, la regla buena es "no
 * entra ni el más corto"** y esta constante se va.
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
    // Solo lo que ocupa la hora: `NO_SHOW` sí —esa hora estuvo tomada—, las
    // cancelaciones y el turno viejo de una reprogramación no.
    if (!ocupaAgenda(appointment.status)) continue
    const duracion = timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)
    if (duracion <= 0) continue
    porDia.set(appointment.day, (porDia.get(appointment.day) ?? 0) + duracion)
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
  if (ocupado >= capacidad) return "llena"
  return capacidad - ocupado <= capacidad * RESTO_MINIMO ? "casi-llena" : "disponible"
}

/** Qué se lleva una ausencia de un día concreto de una persona. */
export interface AbsenceOnDay {
  timeOff: TimeOff
  /** Minutos del turno de trabajo que la ausencia ocupa. */
  minutos: number
  /**
   * Se lleva todo lo que esa persona iba a trabajar.
   *
   * Un día que no trabaja cuenta como completa: si no, unas vacaciones que
   * cruzan el domingo se dibujarían partidas en dos barras.
   */
  completa: boolean
}

/** Cuánto se solapan dos rangos de minutos. 0 si no se tocan. */
function solape(desdeA: number, hastaA: number, desdeB: number, hastaB: number): number {
  return Math.max(0, Math.min(hastaA, hastaB) - Math.max(desdeA, desdeB))
}

/**
 * Cuánto se lleva cada ausencia de cada día, medido contra el horario real de
 * la persona.
 *
 * Es lo que permite distinguir un turno médico de dos horas de unas vacaciones:
 * el primero deja la mañana disponible y no puede tapar el día entero.
 *
 * Si dos ausencias caen el mismo día gana la que se lleva más tiempo: la grilla
 * tiene una celda por día y hay que elegir cuál contar.
 */
export function absenceMinutesByDay(
  items: TimeOff[],
  days: TimelineDay[],
  shifts: EmployeeShift[],
): Map<string, AbsenceOnDay> {
  const capacidad = minutesByWeekday(shifts)
  const porDia = new Map<string, AbsenceOnDay>()

  for (const timeOff of items) {
    const primero = toDateInput(timeOff.startsAt)
    const ultimo = toDateInput(timeOff.endsAt)

    for (const day of days) {
      if (day.key < primero || day.key > ultimo) continue

      // Solo el primer y el último día están recortados por la hora; los del
      // medio los ocupa enteros.
      const desde = day.key === primero ? timeToMinutes(toTimeInput(timeOff.startsAt)) : 0
      const hasta = day.key === ultimo ? timeToMinutes(toTimeInput(timeOff.endsAt)) : DIA_COMPLETO

      const delDia = shifts.filter((shift) => shift.dayOfWeek === day.dayOfWeek)
      const minutos = delDia.reduce(
        (total, shift) =>
          total + solape(desde, hasta, timeToMinutes(shift.startsAt), timeToMinutes(shift.endsAt)),
        0,
      )

      const trabaja = capacidad.get(day.dayOfWeek) ?? 0
      const entrada: AbsenceOnDay = {
        timeOff,
        minutos,
        completa: trabaja <= 0 || minutos >= trabaja,
      }

      const previa = porDia.get(day.key)
      if (!previa || entrada.minutos > previa.minutos) porDia.set(day.key, entrada)
    }
  }

  return porDia
}

/** Una ausencia ya ubicada en la grilla. */
export interface AbsenceSpan {
  timeOff: TimeOff
  /** Primera y última columna que ocupa. */
  start: number
  end: number
  /** La ausencia sigue antes / después de lo que ocupa la barra. */
  continuesBefore: boolean
  continuesAfter: boolean
  /** Fila dentro de la persona. Dos ausencias superpuestas no comparten fila. */
  lane: number
}

/**
 * Arma las barras a partir de los días que la ausencia se lleva **enteros**.
 *
 * Los días que solo se lleva a medias no entran: ahí la persona igual atendió, y
 * taparle la celda diría que no vino. Eso se dibuja dentro de la celda.
 *
 * Por eso una ausencia puede producir más de una barra —o ninguna—: un permiso
 * que arranca a las 14 del lunes y termina el miércoles tapa martes y miércoles,
 * y el lunes queda como celda con un tramo bloqueado.
 */
export function layoutAbsences(
  porDia: Map<string, AbsenceOnDay>,
  days: TimelineDay[],
): { spans: AbsenceSpan[]; lanes: number } {
  const tramos: Omit<AbsenceSpan, "lane">[] = []

  let inicio = -1
  for (let i = 0; i <= days.length; i++) {
    const actual = i < days.length ? porDia.get(days[i]!.key) : undefined
    const abierta = inicio !== -1 ? porDia.get(days[inicio]!.key)!.timeOff : null
    const sigue = actual?.completa === true && actual.timeOff === abierta

    if (inicio !== -1 && !sigue) {
      const timeOff = abierta!
      tramos.push({
        timeOff,
        start: inicio,
        end: i - 1,
        // La ausencia sigue si su propio rango se estira más allá de la barra,
        // sea por quedar fuera de la ventana o por un día tomado a medias.
        continuesBefore: toDateInput(timeOff.startsAt) < days[inicio]!.key,
        continuesAfter: toDateInput(timeOff.endsAt) > days[i - 1]!.key,
      })
      inicio = -1
    }

    if (actual?.completa === true && inicio === -1) inicio = i
  }

  // Reparto codicioso: cada barra va a la primera fila que ya se liberó.
  const laneEnds: number[] = []
  const spans = tramos.map((span) => {
    let lane = laneEnds.findIndex((end) => end < span.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = span.end
    return { ...span, lane }
  })

  return { spans, lanes: Math.max(1, laneEnds.length) }
}

/** Qué dice la barra: el motivo y cuánto dura. */
export function describeAbsence(span: AbsenceSpan): { title: string; detail: string } {
  const title = span.timeOff.reason?.trim() || "Ausencia"
  const dias = span.end - span.start + 1
  const parcial = span.continuesBefore || span.continuesAfter

  if (dias > 1 || parcial) return { title, detail: `${dias} ${dias === 1 ? "día" : "días"}` }

  return { title, detail: "Todo el día" }
}

/** El rango de una ausencia parcial, para el chip dentro de la celda. */
export function absenceRange(timeOff: TimeOff): string {
  return `${toTimeInput(timeOff.startsAt)}–${toTimeInput(timeOff.endsAt)}`
}
