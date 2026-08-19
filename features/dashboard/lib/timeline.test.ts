import { describe, expect, it } from "vitest"
import { buildDays, rangeLabel } from "./timeline"

/** Miércoles. La ventana tiene que arrancar el lunes 7. */
const MIERCOLES = new Date(2026, 8, 9)


describe("buildDays", () => {
  it("arranca el lunes de la semana, no en el día que se le pasa", () => {
    const days = buildDays(MIERCOLES, 14)

    expect(days).toHaveLength(14)
    expect(days[0]!.key).toBe("2026-09-07")
    expect(days[0]!.short).toBe("Lun")
  })

  it("marca hoy en una sola columna", () => {
    const days = buildDays(MIERCOLES, 14)

    expect(days.filter((day) => day.isToday).map((day) => day.key)).toEqual(["2026-09-09"])
  })

  it("marca sábado y domingo, y solo esos", () => {
    const days = buildDays(MIERCOLES, 14)

    expect(days.filter((day) => day.isWeekend).map((day) => day.short)).toEqual([
      "Sáb",
      "Dom",
      "Sáb",
      "Dom",
    ])
  })

  it("cruza el fin de mes sin saltearse días", () => {
    // Lunes 28 de septiembre: la ventana termina en octubre.
    const days = buildDays(new Date(2026, 8, 28), 14)

    expect(days[0]!.key).toBe("2026-09-28")
    expect(days[3]!.key).toBe("2026-10-01")
    expect(days[13]!.key).toBe("2026-10-11")
  })

  it("el domingo abre la semana solo si se lo pide desde un domingo", () => {
    // Domingo 13: pertenece a la semana que arrancó el lunes 7, no a la que viene.
    expect(buildDays(new Date(2026, 8, 13), 7)[0]!.key).toBe("2026-09-07")
  })
})

describe("rangeLabel", () => {
  it("no repite el mes cuando la ventana no lo cruza", () => {
    expect(rangeLabel(buildDays(MIERCOLES, 14))).toBe("7 al 20 de septiembre")
  })

  it("nombra los dos meses cuando la ventana los cruza", () => {
    expect(rangeLabel(buildDays(new Date(2026, 8, 28), 14))).toBe(
      "28 de septiembre al 11 de octubre",
    )
  })
})
