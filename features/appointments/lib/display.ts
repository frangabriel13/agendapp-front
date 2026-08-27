import { personColor } from "@/features/employees/lib/palette"
import type { Appointment } from "@/types"

/**
 * Cómo se lee un turno en pantalla.
 *
 * Los tres datos que toda vista del turno necesita —quién viene, qué se hace y de
 * qué color va— salen de campos distintos de la API, y calcularlos en cada
 * componente es cómo terminan diciendo cosas apenas distintas.
 */

/** "María González", o solo el nombre si no cargaron apellido. */
export function customerName(appointment: Appointment): string {
  const { firstName, lastName } = appointment.customer
  return [firstName, lastName].filter(Boolean).join(" ").trim()
}

/** La inicial para el avatar. */
export function customerInitial(appointment: Appointment): string {
  return appointment.customer.firstName.trim().charAt(0).toUpperCase()
}

/**
 * Qué se hace en el turno.
 *
 * **Un turno puede encadenar varios servicios** con el mismo profesional, así que
 * esto no es un nombre: es la lista. "Corte + Color" es lo que hay que leer en el
 * bloque, no solo "Corte".
 */
export function serviceName(appointment: Appointment): string {
  return appointment.services.map((service) => service.name).join(" + ")
}

/**
 * El color de quien atiende, en hexa.
 *
 * **La API no guarda un color por empleado**, así que sale del hash de su id, con
 * la misma paleta que usan el calendario de ausencias y los avatares del equipo:
 * la misma persona tiene el mismo color en todo el panel.
 */
export function employeeColor(appointment: Appointment): string {
  return personColor(appointment.employee.id).hex
}

/** La inicial de quien atiende. */
export function employeeInitial(appointment: Appointment): string {
  return appointment.employee.name.trim().charAt(0).toUpperCase()
}

/**
 * Alguien del equipo, listo para dibujar.
 *
 * Reemplaza al `Professional` del mock, que traía su color adentro. Acá el color
 * se deriva del id, así que el tipo es lo mínimo que hace falta para un avatar.
 */
export interface Quien {
  id: string
  name: string
  hex: string
}

/**
 * Quiénes atienden algo de esa lista, sin repetir y en orden de aparición.
 *
 * En orden de aparición y no alfabético: las pilas de avatares se leen de
 * izquierda a derecha y el primero es quien tiene el turno más temprano.
 */
export function quienesAtienden(appointments: Appointment[]): Quien[] {
  const vistos = new Map<string, Quien>()

  for (const appointment of appointments) {
    const { id, name } = appointment.employee
    if (!vistos.has(id)) vistos.set(id, { id, name, hex: personColor(id).hex })
  }

  return [...vistos.values()]
}
