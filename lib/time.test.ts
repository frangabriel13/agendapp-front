import { describe, expect, it } from "vitest"
import { dateToStr, parseCalendarDay } from "./time"

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
