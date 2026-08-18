import type { Appointment, AppointmentStatus } from "@/types"

/**
 * Estados que suman plata.
 *
 * `completed` ya se atendió: es plata hecha. `confirmed` está agendado y en pie,
 * así que se cuenta como plata que va a entrar. Los otros tres no suman:
 * `pending` todavía puede no confirmarse, y `cancelled` y `no_show` no ocurrieron.
 */
const ATENDIDO: AppointmentStatus = "completed"
const AGENDADO: AppointmentStatus = "confirmed"

export interface Revenue {
  /** Todo lo que suma: atendido + agendado. */
  total: number
  /** Ya se atendió. */
  atendido: number
  /** Agendado y en pie, todavía no ocurrió. */
  agendado: number
  /** Reservado pero sin confirmar: **no** entra en `total`. */
  sinConfirmar: number
  /** Cuántos turnos hay detrás de `total`. */
  turnos: number
  /** `total / turnos`, redondeado. 0 si no hay turnos. */
  ticketPromedio: number
}

/** ¿El turno cae en el mes "YYYY-MM"? */
function esDelMes(appointment: Appointment, month: string): boolean {
  return appointment.date.startsWith(month)
}

/**
 * La facturación de un mes.
 *
 * Recibe los turnos en vez de pedirlos: hoy salen de datos de ejemplo y mañana
 * de la API, y la cuenta es la misma.
 */
export function monthRevenue(appointments: Appointment[], month: string): Revenue {
  const delMes = appointments.filter((appointment) => esDelMes(appointment, month))

  const sumar = (status: AppointmentStatus) =>
    delMes
      .filter((appointment) => appointment.status === status)
      .reduce((total, appointment) => total + appointment.service.price, 0)

  const atendido = sumar(ATENDIDO)
  const agendado = sumar(AGENDADO)
  const total = atendido + agendado
  const turnos = delMes.filter(
    (appointment) => appointment.status === ATENDIDO || appointment.status === AGENDADO,
  ).length

  return {
    total,
    atendido,
    agendado,
    sinConfirmar: sumar("pending"),
    turnos,
    // Sin turnos el promedio no es cero: no existe. Devolver 0 evita un NaN en
    // pantalla y se lee igual de bien con la etiqueta al lado.
    ticketPromedio: turnos === 0 ? 0 : Math.round(total / turnos),
  }
}

export interface RevenueSlice {
  label: string
  total: number
  turnos: number
  /** Porción del total, de 0 a 1. Para dibujar la barra. */
  share: number
}

/** Reparte la facturación del mes por una clave del turno, de mayor a menor. */
function sliceBy(
  appointments: Appointment[],
  month: string,
  key: (appointment: Appointment) => string,
): RevenueSlice[] {
  const acumulado = new Map<string, { total: number; turnos: number }>()

  for (const appointment of appointments) {
    if (!esDelMes(appointment, month)) continue
    if (appointment.status !== ATENDIDO && appointment.status !== AGENDADO) continue

    const label = key(appointment)
    const previo = acumulado.get(label) ?? { total: 0, turnos: 0 }
    acumulado.set(label, {
      total: previo.total + appointment.service.price,
      turnos: previo.turnos + 1,
    })
  }

  const total = [...acumulado.values()].reduce((suma, item) => suma + item.total, 0)

  return [...acumulado.entries()]
    .map(([label, item]) => ({
      label,
      total: item.total,
      turnos: item.turnos,
      // Contra el total del corte, no contra el máximo: una barra al 100% tiene
      // que significar "se lleva todo", no "es el más grande de la lista".
      share: total === 0 ? 0 : item.total / total,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "es"))
}

export function revenueByService(appointments: Appointment[], month: string): RevenueSlice[] {
  return sliceBy(appointments, month, (appointment) => appointment.service.name)
}

export function revenueByProfessional(appointments: Appointment[], month: string): RevenueSlice[] {
  return sliceBy(appointments, month, (appointment) => appointment.professional.name)
}

/** "Agosto" a partir de "2026-08". Para titular el período. */
export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  const texto = new Date(year!, monthNumber! - 1, 1).toLocaleDateString("es-AR", { month: "long" })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
