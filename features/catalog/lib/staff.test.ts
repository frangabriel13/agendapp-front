import { describe, expect, it } from "vitest"
import { quienesPrestanTodos } from "./staff"
import type { ServiceEmployee } from "@/types"

const CENTRO = "b-centro"
const PALERMO = "b-palermo"

const par = (employeeId: string, employeeName: string, branchId: string): ServiceEmployee => ({
  employeeId,
  employeeName,
  branchId,
  branchName: branchId === CENTRO ? "Sucursal Centro" : "Sucursal Palermo",
})

// Como en el seed: Lucía hace corte y color; Ana solo corte.
const LUCIA_CORTE = par("e-lucia", "Lucía", CENTRO)
const LUCIA_COLOR = par("e-lucia", "Lucía", CENTRO)
const ANA_CORTE = par("e-ana", "Ana", CENTRO)

describe("quienesPrestanTodos", () => {
  it("con un solo servicio son todos los de esa sucursal", () => {
    expect(quienesPrestanTodos([[LUCIA_CORTE, ANA_CORTE]], CENTRO)).toEqual([
      LUCIA_CORTE,
      ANA_CORTE,
    ])
  })

  it("con dos servicios deja solo a quien hace los dos", () => {
    const resultado = quienesPrestanTodos([[LUCIA_CORTE, ANA_CORTE], [LUCIA_COLOR]], CENTRO)

    expect(resultado.map((p) => p.employeeId)).toEqual(["e-lucia"])
  })

  it("si nadie hace todos, no queda nadie", () => {
    const soloAna = [par("e-ana", "Ana", CENTRO)]
    const soloLucia = [par("e-lucia", "Lucía", CENTRO)]

    expect(quienesPrestanTodos([soloAna, soloLucia], CENTRO)).toEqual([])
  })

  it("la misma persona en otra sucursal no completa el par", () => {
    // Lucía hace color, pero en Palermo. Para un turno en Centro no sirve.
    const colorEnPalermo = [par("e-lucia", "Lucía", PALERMO)]

    expect(quienesPrestanTodos([[LUCIA_CORTE], colorEnPalermo], CENTRO)).toEqual([])
  })

  it("filtra por la sucursal elegida", () => {
    const enLasDos = [LUCIA_CORTE, par("e-lucia", "Lucía", PALERMO)]

    expect(quienesPrestanTodos([enLasDos], PALERMO).map((p) => p.branchId)).toEqual([PALERMO])
  })

  it("sin servicios no hay a quién ofrecer", () => {
    expect(quienesPrestanTodos([], CENTRO)).toEqual([])
  })

  it("sin sucursal elegida tampoco", () => {
    expect(quienesPrestanTodos([[LUCIA_CORTE]], null)).toEqual([])
  })
})
