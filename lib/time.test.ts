import { describe, expect, it } from "vitest"
import { dateToStr, parseCalendarDay , splitInstant, toInstant } from "./time"

describe("parseCalendarDay", () => {
  it("corre en una zona con offset negativo, o no prueba nada", () => {
    // Sin esto el resto del bloque se aprueba solo: en UTC la versión con bug
    // devuelve exactamente lo mismo que la correcta. La zona la fija
    // `vitest.config.mts`; esta aserción avisa si alguien la saca.
    expect(new Date().getTimezoneOffset()).toBeGreaterThan(0)
  })

  it("interpreta el día en hora local, no en UTC", () => {
    // `new Date("2026-12-25")` se lee como UTC y en América se corre al 24.
    const fecha = parseCalendarDay("2026-12-25")

    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(11)
    expect(fecha.getDate()).toBe(25)
  })

  it("no se corre de día en ninguna fecha del año", () => {
    for (const date of ["2026-01-01", "2026-06-30", "2026-07-01", "2026-12-31"]) {
      const [, , dia] = date.split("-").map(Number)
      expect(parseCalendarDay(date).getDate()).toBe(dia)
    }
  })

  it("es la inversa de dateToStr", () => {
    for (const date of ["2026-01-01", "2026-03-08", "2026-11-01", "2026-12-31"]) {
      expect(dateToStr(parseCalendarDay(date))).toBe(date)
    }
  })
})

/**
 * La zona está fijada en `vitest.config.mts` a America/Argentina/Buenos_Aires
 * (UTC−3), así que estos números son estables: sin eso el test pasaría o fallaría
 * según dónde corriera.
 */
describe("splitInstant", () => {
  it("parte un instante en día y hora de pared", () => {
    // 12:00 UTC son las 9 de la mañana acá.
    expect(splitInstant("2026-09-07T12:00:00.000Z")).toEqual({ day: "2026-09-07", time: "09:00" })
  })

  /**
   * La trampa que justifica la función: a la mañana temprano, UTC ya está en el
   * día siguiente. Usar la parte de fecha del ISO movería el turno un día.
   */
  it("usa el día local, no el del ISO", () => {
    // 02:00 UTC del 8 son las 23:00 del 7 acá.
    expect(splitInstant("2026-09-08T02:00:00.000Z")).toEqual({ day: "2026-09-07", time: "23:00" })
  })
})

describe("toInstant", () => {
  it("es la vuelta de splitInstant", () => {
    const iso = toInstant("2026-09-07", "09:00")

    expect(splitInstant(iso)).toEqual({ day: "2026-09-07", time: "09:00" })
  })

  it("interpreta la hora en la zona local, no en UTC", () => {
    expect(toInstant("2026-09-07", "09:00")).toBe("2026-09-07T12:00:00.000Z")
  })
})
