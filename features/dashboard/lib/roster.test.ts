import { describe, expect, it } from "vitest"
import type { Employee, EmployeeRole } from "@/types"
import { turno } from "@/features/appointments/lib/fixtures"
import { appointmentsByEmployee, atiende } from "./roster"

const empleado = (id: string, role: EmployeeRole): Employee =>
  ({ id, role, isActive: true }) as Employee

const EQUIPO = [
  empleado("e1", "OWNER"),
  empleado("e2", "PROFESSIONAL"),
  empleado("e3", "ADMINISTRATIVE"),
]

describe("atiende", () => {
  it("el administrativo no atiende; el dueño y el profesional sí", () => {
    expect(EQUIPO.map(atiende)).toEqual([true, true, false])
  })
})

/**
 * Hasta la Fase 5 esto repartía los turnos por posición, porque el mock traía
 * ids inventados que no existían en la API. **Ahora `employee.id` es el id real**
 * y el agrupamiento es directo: lo que se prueba acá es que nadie quede afuera y
 * que no aparezcan filas fantasma.
 */
describe("appointmentsByEmployee", () => {
  const TURNOS = [
    turno({ id: "a1", employeeId: "e1" }),
    turno({ id: "a2", employeeId: "e2" }),
    turno({ id: "a3", employeeId: "e1" }),
  ]

  it("agrupa cada turno con quien lo atiende", () => {
    const porEmpleado = appointmentsByEmployee(EQUIPO, TURNOS)

    expect(porEmpleado.get("e1")?.map((a) => a.id)).toEqual(["a1", "a3"])
    expect(porEmpleado.get("e2")?.map((a) => a.id)).toEqual(["a2"])
  })

  // Un administrativo gestiona la agenda pero no atiende: si tuviera un turno
  // cargado, su fila del calendario igual no debería mostrar carga.
  it("ignora los turnos del administrativo", () => {
    const conAdmin = [...TURNOS, turno({ id: "a4", employeeId: "e3" })]

    expect(appointmentsByEmployee(EQUIPO, conAdmin).has("e3")).toBe(false)
  })

  /**
   * El caso que evita una fila fantasma: alguien que ya no está en el equipo
   * puede seguir teniendo turnos viejos, y el calendario dibuja una fila por
   * empleado. Sin este filtro aparecería una fila de nadie.
   */
  it("descarta los turnos de alguien que no está en el equipo", () => {
    const conFantasma = [...TURNOS, turno({ id: "a5", employeeId: "ya-no-esta" })]
    const porEmpleado = appointmentsByEmployee(EQUIPO, conFantasma)

    expect(porEmpleado.has("ya-no-esta")).toBe(false)
    expect([...porEmpleado.keys()].sort()).toEqual(["e1", "e2"])
  })

  it("sin nadie que atienda, devuelve vacío en vez de romper", () => {
    expect(appointmentsByEmployee([], TURNOS).size).toBe(0)
    expect(appointmentsByEmployee([empleado("e9", "ADMINISTRATIVE")], TURNOS).size).toBe(0)
  })

  it("no pierde ningún turno de quienes sí atienden", () => {
    const porEmpleado = appointmentsByEmployee(EQUIPO, TURNOS)
    const repartidos = [...porEmpleado.values()].flat()

    expect(repartidos).toHaveLength(TURNOS.length)
  })
})
