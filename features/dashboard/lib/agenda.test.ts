import { describe, expect, it } from "vitest"
import type { Appointment } from "@/types"
import { nextUpIndex, nextUpLabel } from "./agenda"

const turno = (startTime: string, endTime: string) =>
  ({ id: `${startTime}`, startTime, endTime }) as Appointment

const AGENDA = [turno("09:00", "10:00"), turno("11:00", "12:30"), turno("15:00", "16:15")]

describe("nextUpIndex", () => {
  it("antes de abrir, el que sigue es el primero", () => {
    expect(nextUpIndex(AGENDA, "08:00")).toBe(0)
  })

  it("el que está en curso sigue siendo el que sigue", () => {
    expect(nextUpIndex(AGENDA, "09:30")).toBe(0)
  })

  it("recién cuando termina pasa al siguiente", () => {
    expect(nextUpIndex(AGENDA, "10:00")).toBe(1)
  })

  it("saltea los que ya pasaron", () => {
    expect(nextUpIndex(AGENDA, "13:00")).toBe(2)
  })

  it("terminada la jornada no destaca ninguno", () => {
    expect(nextUpIndex(AGENDA, "17:00")).toBe(-1)
  })

  it("sin turnos no destaca ninguno", () => {
    expect(nextUpIndex([], "10:00")).toBe(-1)
  })
})

describe("nextUpLabel", () => {
  it("dice cuántos minutos faltan cuando falta menos de una hora", () => {
    expect(nextUpLabel(AGENDA[0]!, "08:45")).toBe("En 15 min")
  })

  it("a una hora justa ya muestra la hora, no 60 min", () => {
    expect(nextUpLabel(AGENDA[0]!, "08:00")).toBe("A las 09:00")
  })

  it("una vez empezado dice que está en curso", () => {
    expect(nextUpLabel(AGENDA[0]!, "09:00")).toBe("En curso")
    expect(nextUpLabel(AGENDA[0]!, "09:40")).toBe("En curso")
  })
})
