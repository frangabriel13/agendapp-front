import { describe, expect, it } from "vitest"
import { toInstant } from "@/features/employees/lib/timeOff"
import type { TimeOff } from "@/types"
import { buildDays, describeAbsence, layoutAbsences, rangeLabel } from "./timeline"

/** Miércoles. La ventana tiene que arrancar el lunes 7. */
const MIERCOLES = new Date(2026, 8, 9)

const ausencia = (from: string, to: string, overrides: Partial<TimeOff> = {}): TimeOff => ({
  id: `${from}/${to}`,
  employeeId: "e1",
  branchId: null,
  startsAt: toInstant(from, "00:00"),
  endsAt: toInstant(to, "23:59"),
  reason: null,
  ...overrides,
})

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

describe("layoutAbsences", () => {
  const days = buildDays(MIERCOLES, 14)

  it("ubica la ausencia en las columnas de sus días", () => {
    const { spans } = layoutAbsences([ausencia("2026-09-09", "2026-09-11")], days)

    expect(spans[0]).toMatchObject({ start: 2, end: 4, continuesBefore: false, continuesAfter: false })
  })

  it("recorta la que empieza antes de la ventana y avisa que sigue", () => {
    const { spans } = layoutAbsences([ausencia("2026-09-01", "2026-09-09")], days)

    expect(spans[0]).toMatchObject({ start: 0, end: 2, continuesBefore: true, continuesAfter: false })
  })

  it("recorta la que termina después de la ventana y avisa que sigue", () => {
    const { spans } = layoutAbsences([ausencia("2026-09-18", "2026-10-05")], days)

    expect(spans[0]).toMatchObject({ start: 11, end: 13, continuesBefore: false, continuesAfter: true })
  })

  it("descarta las que quedan fuera, de los dos lados", () => {
    const fuera = [ausencia("2026-08-01", "2026-08-10"), ausencia("2026-10-01", "2026-10-05")]

    expect(layoutAbsences(fuera, days).spans).toHaveLength(0)
  })

  it("conserva la que toca la ventana por un solo día", () => {
    const { spans } = layoutAbsences([ausencia("2026-08-30", "2026-09-07")], days)

    expect(spans).toHaveLength(1)
    expect(spans[0]).toMatchObject({ start: 0, end: 0 })
  })

  it("manda a otra fila las que se superponen", () => {
    const { spans, lanes } = layoutAbsences(
      [ausencia("2026-09-07", "2026-09-10"), ausencia("2026-09-09", "2026-09-14")],
      days,
    )

    expect(spans.map((span) => span.lane)).toEqual([0, 1])
    expect(lanes).toBe(2)
  })

  it("reusa la fila cuando una termina antes de que empiece la otra", () => {
    const { spans, lanes } = layoutAbsences(
      [ausencia("2026-09-07", "2026-09-08"), ausencia("2026-09-10", "2026-09-11")],
      days,
    )

    expect(spans.map((span) => span.lane)).toEqual([0, 0])
    expect(lanes).toBe(1)
  })

  it("no comparte fila con la que arranca el día que termina la anterior", () => {
    // Dos ausencias en el mismo día se pisarían: la segunda baja de fila.
    const { spans } = layoutAbsences(
      [ausencia("2026-09-07", "2026-09-09"), ausencia("2026-09-09", "2026-09-10")],
      days,
    )

    expect(spans.map((span) => span.lane)).toEqual([0, 1])
  })

  it("sin ausencias deja una sola fila, para que la persona ocupe alto igual", () => {
    expect(layoutAbsences([], days)).toEqual({ spans: [], lanes: 1 })
  })
})

describe("describeAbsence", () => {
  it("cuenta los días de punta a punta, incluyendo los dos extremos", () => {
    expect(describeAbsence(ausencia("2026-09-07", "2026-09-11")).detail).toBe("5 días")
  })

  it("cuenta bien aunque en el medio cambie el horario de verano", () => {
    // Argentina no tiene DST, así que este caso hay que ir a buscarlo a otra
    // zona: en Santiago el 6 de septiembre de 2026 el día dura 23 horas, y una
    // semana mide 6,96 días. Dividir sin redondear devolvería "6 días".
    // `tenant.timezone` existe justamente porque el negocio puede no estar acá.
    const original = process.env.TZ
    try {
      process.env.TZ = "America/Santiago"
      expect(describeAbsence(ausencia("2026-09-02", "2026-09-08")).detail).toBe("7 días")
    } finally {
      process.env.TZ = original
    }
  })

  it("un día entero se anuncia como tal", () => {
    expect(describeAbsence(ausencia("2026-09-09", "2026-09-09")).detail).toBe("Todo el día")
  })

  it("unas horas sueltas muestran el rango", () => {
    const parcial = ausencia("2026-09-09", "2026-09-09", {
      startsAt: toInstant("2026-09-09", "14:00"),
      endsAt: toInstant("2026-09-09", "18:30"),
    })

    expect(describeAbsence(parcial).detail).toBe("14:00–18:30")
  })

  it("sin motivo dice 'Ausencia' en vez de dejar la barra vacía", () => {
    expect(describeAbsence(ausencia("2026-09-09", "2026-09-09")).title).toBe("Ausencia")
    expect(describeAbsence(ausencia("2026-09-09", "2026-09-09", { reason: "  " })).title).toBe(
      "Ausencia",
    )
    expect(describeAbsence(ausencia("2026-09-09", "2026-09-09", { reason: "Vacaciones" })).title).toBe(
      "Vacaciones",
    )
  })
})
