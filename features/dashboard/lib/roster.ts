import type { Appointment, Employee } from "@/types"

/**
 * Quién puede tener turnos.
 *
 * Un administrativo gestiona la agenda pero no atiende, así que su fila del
 * calendario no muestra carga —sí ausencias: también se toma vacaciones—.
 */
export function atiende(employee: Employee): boolean {
  return employee.role !== "ADMINISTRATIVE"
}

/**
 * Reparte los turnos entre las personas del equipo.
 *
 * **Puente temporal, y se borra con la Fase 5.** Los turnos son de ejemplo y
 * traen ids de profesionales inventados (`p1`, `p2`…) que no existen en la API,
 * así que no hay forma de cruzarlos con los empleados reales: se reparten por
 * posición entre quienes atienden. Cuando el backend exponga turnos,
 * `professionalId` va a ser el id del empleado y esto es un `filter` directo.
 *
 * El orden sale de los ids ordenados y no del orden de aparición, para que la
 * asignación no cambie si mañana se agrega un turno al principio de la lista.
 */
export function appointmentsByEmployee(
  employees: Employee[],
  appointments: Appointment[],
): Map<string, Appointment[]> {
  const porEmpleado = new Map<string, Appointment[]>()
  const atienden = employees.filter(atiende)
  if (atienden.length === 0) return porEmpleado

  const profesionales = [...new Set(appointments.map((a) => a.professionalId))].sort()

  for (const appointment of appointments) {
    const posicion = profesionales.indexOf(appointment.professionalId)
    const empleado = atienden[posicion % atienden.length]!
    const previos = porEmpleado.get(empleado.id) ?? []
    previos.push(appointment)
    porEmpleado.set(empleado.id, previos)
  }

  return porEmpleado
}
