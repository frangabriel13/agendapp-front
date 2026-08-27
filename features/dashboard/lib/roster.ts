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
 * Agrupa los turnos por la persona que los atiende.
 *
 * Hasta la Fase 5 esto era un puente: los turnos de ejemplo traían ids
 * inventados (`p1`, `p2`…) que no existían en la API, y había que repartirlos por
 * posición. **Ahora `employee.id` es el id del empleado de verdad**, así que es
 * un agrupamiento directo.
 *
 * Recibe `employees` para no inventar filas: un turno de alguien que ya no está
 * en el equipo —o de un administrativo, que no debería tener— se descarta en vez
 * de crear una fila fantasma en el calendario.
 */
export function appointmentsByEmployee(
  employees: Employee[],
  appointments: Appointment[],
): Map<string, Appointment[]> {
  const porEmpleado = new Map<string, Appointment[]>()
  const atienden = new Set(employees.filter(atiende).map((employee) => employee.id))

  for (const appointment of appointments) {
    const id = appointment.employee.id
    if (!atienden.has(id)) continue

    const previos = porEmpleado.get(id) ?? []
    previos.push(appointment)
    porEmpleado.set(id, previos)
  }

  return porEmpleado
}
