import { describe, expect, it } from "vitest"
import type { BusinessHour, SpecialDay } from "@/types"
import { closedDays } from "./openDays"
import { buildDays } from "./timeline"

/** Miércoles 9 de septiembre de 2026. La ventana arranca el lunes 7. */
const DIAS = buildDays(new Date(2026, 8, 9), 14)

/** Abre de lunes a sábado; el domingo cierra. */
const SEMANA_NORMAL: BusinessHour[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  isClosed: dayOfWeek === 0,
  opensAt: dayOfWeek === 0 ? null : "09:00",
  closesAt: dayOfWeek === 0 ? null : "19:00",
}))

const especial = (date: string, isClosed: boolean, description: string | null = null): SpecialDay =>
  ({ id: date, date, isClosed, opensAt: null, closesAt: null, description }) as SpecialDay

describe("closedDays", () => {
  it("sin sucursales no raya nada", () => {
    expect(closedDays(DIAS, new Map(), new Map()).size).toBe(0)
  })

  it("con los horarios todavía sin cargar tampoco raya nada", () => {
    // Devolver "todo cerrado" mientras carga diría que el negocio no abre nunca.
    expect(closedDays(DIAS, new Map([["b1", []]]), new Map()).size).toBe(0)
  })

  it("marca los días que la sucursal no abre", () => {
    const cerrados = closedDays(DIAS, new Map([["b1", SEMANA_NORMAL]]), new Map())

    // Domingo 13 y domingo 20.
    expect([...cerrados.keys()]).toEqual(["2026-09-13", "2026-09-20"])
    expect(cerrados.get("2026-09-13")).toEqual({ motivo: "horario" })
  })

  it("alcanza con que abra una sucursal para que el día no cuente como cerrado", () => {
    const domingueros: BusinessHour[] = SEMANA_NORMAL.map((h) =>
      h.dayOfWeek === 0 ? { ...h, isClosed: false, opensAt: "10:00", closesAt: "16:00" } : h,
    )
    const cerrados = closedDays(
      DIAS,
      new Map([
        ["b1", SEMANA_NORMAL],
        ["b2", domingueros],
      ]),
      new Map(),
    )

    expect(cerrados.size).toBe(0)
  })

  it("un feriado cierra un día que normalmente abre, y lo dice", () => {
    const cerrados = closedDays(
      DIAS,
      new Map([["b1", SEMANA_NORMAL]]),
      new Map([["b1", [especial("2026-09-10", true, "Feriado puente")]]]),
    )

    expect(cerrados.get("2026-09-10")).toEqual({ motivo: "especial", nombre: "Feriado puente" })
  })

  it("un feriado sin nombre igual cierra", () => {
    const cerrados = closedDays(
      DIAS,
      new Map([["b1", SEMANA_NORMAL]]),
      new Map([["b1", [especial("2026-09-10", true)]]]),
    )

    expect(cerrados.get("2026-09-10")).toEqual({ motivo: "especial" })
  })

  it("un horario especial abre un día que normalmente cierra", () => {
    // `isClosed: false` en un día especial es "abro, pero con otro horario".
    const cerrados = closedDays(
      DIAS,
      new Map([["b1", SEMANA_NORMAL]]),
      new Map([["b1", [especial("2026-09-13", false, "Domingo de promoción")]]]),
    )

    expect(cerrados.has("2026-09-13")).toBe(false)
  })

  it("un feriado en una sucursal no cierra el negocio si la otra abre", () => {
    const cerrados = closedDays(
      DIAS,
      new Map([
        ["b1", SEMANA_NORMAL],
        ["b2", SEMANA_NORMAL],
      ]),
      new Map([["b1", [especial("2026-09-10", true, "Solo en Centro")]]]),
    )

    expect(cerrados.has("2026-09-10")).toBe(false)
  })

  it("un feriado en todas las sucursales sí cierra", () => {
    const cerrados = closedDays(
      DIAS,
      new Map([
        ["b1", SEMANA_NORMAL],
        ["b2", SEMANA_NORMAL],
      ]),
      new Map([
        ["b1", [especial("2026-09-10", true, "Navidad")]],
        ["b2", [especial("2026-09-10", true, "Navidad")]],
      ]),
    )

    expect(cerrados.get("2026-09-10")).toEqual({ motivo: "especial", nombre: "Navidad" })
  })
})
