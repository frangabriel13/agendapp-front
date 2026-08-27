import { describe, expect, it } from "vitest"
import { motivoSinHorarios } from "./slots"

const sin = (branchClosed = false, noEmployeeForServices = false) => ({
  branchClosed,
  noEmployeeForServices,
})

describe("motivoSinHorarios", () => {
  it("con los dos flags apagados dice que no hay lugar", () => {
    expect(motivoSinHorarios(sin(), 1)).toBe("No queda ningún horario libre ese día.")
  })

  it("distingue la sucursal cerrada", () => {
    expect(motivoSinHorarios(sin(true), 1)).toBe("Ese día la sucursal está cerrada.")
  })

  it("cuando nadie lo presta avisa que cambiar de día no sirve", () => {
    // Es la diferencia que importa: los otros dos motivos se destraban con otra
    // fecha y este no.
    expect(motivoSinHorarios(sin(false, true), 1)).toContain("Cambiar de día no ayuda")
  })

  it("con varios servicios habla de hacerlos todos, no de cada uno", () => {
    // La API responde la intersección: el turno lo atiende una sola persona.
    expect(motivoSinHorarios(sin(false, true), 2)).toContain("todos esos servicios juntos")
  })

  it("con los dos flags prendidos gana el que no se arregla cambiando de día", () => {
    expect(motivoSinHorarios(sin(true, true), 1)).toContain("Cambiar de día no ayuda")
  })
})
