import { describe, expect, it } from "vitest"
import type { Appointment, Employee, EmployeeRole } from "@/types"
import { appointmentsByEmployee, atiende } from "./roster"

const empleado = (id: string, role: EmployeeRole): Employee =>
  ({ id, role, isActive: true }) as Employee

const turno = (id: string, professionalId: string): Appointment =>
  ({ id, professionalId }) as Appointment

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

describe("appointmentsByEmployee", () => {
  const TURNOS = [
    turno("a1", "p1"),
    turno("a2", "p2"),
    turno("a3", "p1"),
    turno("a4", "p3"),
  ]

  it("no le asigna turnos al administrativo", () => {
    expect(appointmentsByEmployee(EQUIPO, TURNOS).has("e3")).toBe(false)
  })

  it("reparte todos los turnos, sin perder ninguno", () => {
    const repartidos = [...appointmentsByEmployee(EQUIPO, TURNOS).values()].flat()

    expect(repartidos).toHaveLength(TURNOS.length)
  })

  it("los turnos del mismo profesional van a la misma persona", () => {
    const porEmpleado = appointmentsByEmployee(EQUIPO, TURNOS)
    const de = (id: string) => [...porEmpleado.entries()].find(([, ts]) => ts.some((t) => t.id === id))?.[0]

    expect(de("a1")).toBe(de("a3"))
    expect(de("a1")).not.toBe(de("a2"))
  })

  it("el reparto no depende del orden de los turnos", () => {
    const alRevés = appointmentsByEmployee(EQUIPO, [...TURNOS].reverse())
    const derecho = appointmentsByEmployee(EQUIPO, TURNOS)
    const ids = (m: Map<string, Appointment[]>, e: string) =>
      (m.get(e) ?? []).map((t) => t.id).sort()

    for (const e of ["e1", "e2"]) expect(ids(alRevés, e)).toEqual(ids(derecho, e))
  })

  it("con más profesionales que empleados, da la vuelta sin dejar turnos afuera", () => {
    const soloUno = [empleado("e1", "PROFESSIONAL")]

    expect(appointmentsByEmployee(soloUno, TURNOS).get("e1")).toHaveLength(4)
  })

  it("sin nadie que atienda, devuelve vacío en vez de romper", () => {
    expect(appointmentsByEmployee([empleado("e3", "ADMINISTRATIVE")], TURNOS).size).toBe(0)
  })
})
