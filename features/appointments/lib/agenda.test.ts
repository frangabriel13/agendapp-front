import { describe, expect, it } from "vitest"
import {
  boardColumns,
  busiestDay,
  containsToday,
  elapsedFraction,
  gridRange,
  monthCells,
  weekStats,
} from "./agenda"
import { getWeekDates } from "./week"
import type { AppointmentStatus } from "@/types"
import { turno as base } from "./fixtures"

/** Los montos van en **centavos**, como los devuelve la API. */
function turno(
  day: string,
  from: string,
  to: string,
  status: AppointmentStatus,
  extra: { precio?: number; pro?: string } = {},
) {
  return base({
    day,
    from,
    to,
    status,
    employeeId: extra.pro ?? "p1",
    cents: extra.precio ?? 4_500_000,
  })
}

/* Lunes 17 al domingo 23 de agosto de 2026. */
const SEMANA = getWeekDates(new Date(2026, 7, 19))

describe("weekStats", () => {
  const turnos = [
    turno("2026-08-17", "09:00", "10:00", "ATTENDED", { precio: 10_000 }),
    turno("2026-08-19", "14:00", "15:00", "CONFIRMED", { precio: 20_000 }),
    turno("2026-08-20", "10:00", "11:00", "PENDING_PAYMENT", { precio: 5_000 }),
    turno("2026-08-21", "10:00", "11:00", "CANCELED_BY_CUSTOMER", { precio: 99_000 }),
    // Fuera de la semana: no tiene que contarse por ningún lado.
    turno("2026-08-24", "09:00", "10:00", "CONFIRMED", { precio: 70_000 }),
  ]

  it("cuenta los turnos de la semana y los reparte por estado", () => {
    const stats = weekStats(turnos, SEMANA)
    expect(stats.total).toBe(4)
    expect(stats.porEstado).toEqual({
      PENDING_PAYMENT: 1,
      CONFIRMED: 1,
      ATTENDED: 1,
      CANCELED_BY_CUSTOMER: 1,
      CANCELED_BY_BUSINESS: 0,
      RESCHEDULED: 0,
      NO_SHOW: 0,
    })
  })

  it("deja lo pendiente afuera del agendado, y lo cancelado afuera de todo", () => {
    // Si `pending` sumara, el número diría plata que todavía puede no entrar; y
    // los 99.000 del cancelado no son de nadie.
    const stats = weekStats(turnos, SEMANA)
    expect(stats.agendado).toBe(30_000)
    expect(stats.sinConfirmar).toBe(5_000)
  })

  it("una semana sin turnos da cero, no falla", () => {
    expect(weekStats([], SEMANA)).toEqual({
      total: 0,
      porEstado: {
        PENDING_PAYMENT: 0,
        CONFIRMED: 0,
        ATTENDED: 0,
        NO_SHOW: 0,
        CANCELED_BY_CUSTOMER: 0,
        CANCELED_BY_BUSINESS: 0,
        RESCHEDULED: 0,
      },
      agendado: 0,
      sinConfirmar: 0,
    })
  })
})

describe("boardColumns", () => {
  const dia = new Date(2026, 7, 19)
  const turnos = [
    turno("2026-08-19", "17:00", "17:45", "PENDING_PAYMENT"),
    turno("2026-08-19", "09:00", "10:00", "ATTENDED"),
    turno("2026-08-19", "14:00", "15:30", "CONFIRMED"),
    turno("2026-08-19", "18:00", "19:00", "CANCELED_BY_CUSTOMER", { pro: "p2" }),
    turno("2026-08-19", "11:00", "12:00", "NO_SHOW", { pro: "p3" }),
    turno("2026-08-20", "09:00", "10:00", "CONFIRMED"),
  ]

  it("junta cancelado y no asistió en la misma columna", () => {
    // Separarlas daría una quinta columna casi siempre vacía; las dos significan
    // lo mismo para el día: ese turno no se hizo.
    const columnas = boardColumns(turnos, dia)
    expect(columnas.map((c) => c.key)).toEqual(["pending", "confirmed", "completed", "off"])
    expect(columnas[3]!.items.map((a) => a.status)).toEqual(["NO_SHOW", "CANCELED_BY_CUSTOMER"])
  })

  it("solo mira el día pedido y ordena por hora", () => {
    const columnas = boardColumns(turnos, dia)
    expect(columnas.flatMap((c) => c.items)).toHaveLength(5)
    expect(columnas[3]!.items[0]!.startTime).toBe("11:00")
  })

  it("suma los minutos y la plata de cada columna", () => {
    const columnas = boardColumns(turnos, dia)
    expect(columnas[1]!.minutos).toBe(90)
    // En centavos, como los devuelve la API: son $45.000.
    expect(columnas[0]!.plata).toBe(4_500_000)
  })

  it("un día vacío devuelve las cuatro columnas, no una lista corta", () => {
    // La grilla del tablero es fija: si faltara una columna se correrían todas.
    const columnas = boardColumns([], dia)
    expect(columnas).toHaveLength(4)
    expect(columnas.every((c) => c.items.length === 0)).toBe(true)
  })
})

describe("elapsedFraction", () => {
  const ahora = new Date(2026, 7, 19, 14, 20)

  it("lo de ayer está entero y lo de mañana sin empezar", () => {
    expect(elapsedFraction(turno("2026-08-18", "09:00", "10:00", "ATTENDED"), ahora)).toBe(1)
    expect(elapsedFraction(turno("2026-08-20", "09:00", "10:00", "CONFIRMED"), ahora)).toBe(0)
  })

  it("el que está ocurriendo va a medias", () => {
    // 14:00 a 15:30, son las 14:20: 20 de 90 minutos.
    expect(elapsedFraction(turno("2026-08-19", "14:00", "15:30", "CONFIRMED"), ahora)).toBeCloseTo(
      20 / 90,
    )
  })

  it("recorta en 0 y en 1 dentro del mismo día", () => {
    expect(elapsedFraction(turno("2026-08-19", "17:00", "18:00", "CONFIRMED"), ahora)).toBe(0)
    expect(elapsedFraction(turno("2026-08-19", "09:00", "10:00", "ATTENDED"), ahora)).toBe(1)
  })

  it("no divide por cero con un turno de duración cero", () => {
    expect(elapsedFraction(turno("2026-08-19", "10:00", "10:00", "ATTENDED"), ahora)).toBe(1)
  })
})

describe("containsToday", () => {
  it("distingue la semana que se está viviendo de las otras", () => {
    const hoy = new Date(2026, 7, 19, 14, 20)
    expect(containsToday(SEMANA, hoy)).toBe(true)
    expect(containsToday(getWeekDates(new Date(2026, 7, 12)), hoy)).toBe(false)
  })
})

describe("monthCells", () => {
  const hoy = new Date(2026, 7, 19, 14, 20)
  const agosto = new Date(2026, 7, 1)

  it("arranca el lunes y siempre trae seis semanas", () => {
    const celdas = monthCells(agosto, [], hoy)
    expect(celdas).toHaveLength(42)
    // El 1 de agosto de 2026 cae sábado, así que la fila empieza el 27 de julio.
    expect(celdas[0]!.key).toBe("2026-07-27")
    expect(celdas[0]!.inMonth).toBe(false)
    expect(celdas[5]!.key).toBe("2026-08-01")
    expect(celdas[5]!.inMonth).toBe(true)
  })

  it("marca hoy y los domingos", () => {
    const celdas = monthCells(agosto, [], hoy)
    const dia19 = celdas.find((c) => c.key === "2026-08-19")!
    expect(dia19.isToday).toBe(true)
    expect(celdas.filter((c) => c.isSunday).map((c) => c.key)).toContain("2026-08-23")
  })

  it("cuenta los turnos del día y lista quién atiende, sin repetir", () => {
    const celdas = monthCells(
      agosto,
      [
        turno("2026-08-19", "09:00", "10:00", "ATTENDED", { pro: "p1" }),
        turno("2026-08-19", "11:00", "12:00", "CONFIRMED", { pro: "p1" }),
        turno("2026-08-19", "14:00", "15:00", "CONFIRMED", { pro: "p2" }),
      ],
      hoy,
    )
    const dia19 = celdas.find((c) => c.key === "2026-08-19")!
    expect(dia19.count).toBe(3)
    expect(dia19.professionals).toEqual(["p1", "p2"])
  })

  it("el cancelado no ocupa el día", () => {
    // Sin esto un día lleno de bajas se vería igual de cargado que uno vendido.
    const celdas = monthCells(
      agosto,
      [turno("2026-08-19", "09:00", "10:00", "CANCELED_BY_CUSTOMER", { pro: "p1" })],
      hoy,
    )
    expect(celdas.find((c) => c.key === "2026-08-19")!.count).toBe(0)
  })

  it("no se cuelga un turno de otro mes en la celda de arrastre", () => {
    // El 27 de julio está en la grilla de agosto: su turno tiene que aparecer ahí.
    const celdas = monthCells(agosto, [turno("2026-07-27", "09:00", "10:00", "ATTENDED")], hoy)
    expect(celdas[0]!.count).toBe(1)
  })
})

describe("busiestDay", () => {
  it("devuelve el pico del mes", () => {
    const celdas = monthCells(
      new Date(2026, 7, 1),
      [
        turno("2026-08-19", "09:00", "10:00", "CONFIRMED", { pro: "p1" }),
        turno("2026-08-19", "11:00", "12:00", "CONFIRMED", { pro: "p2" }),
        turno("2026-08-20", "09:00", "10:00", "CONFIRMED", { pro: "p1" }),
      ],
      new Date(2026, 7, 19),
    )
    expect(busiestDay(celdas)).toBe(2)
  })

  it("sin turnos devuelve cero y no rompe la división de la barra", () => {
    expect(busiestDay([])).toBe(0)
  })
})

/**
 * El bug que esto atrapa: la grilla estaba fija en 8–20, y un turno de 19:55 a
 * 20:50 se dibujaba fuera de la caja y quedaba cortado a la mitad. Apareció con
 * datos reales —los horarios los define cada negocio— y no con el mock, que
 * tenía todos los turnos cómodos adentro del rango.
 */
describe("gridRange", () => {
  it("respeta el rango por defecto cuando todo entra", () => {
    const turnos = [turno("2026-09-07", "09:00", "10:00", "CONFIRMED")]

    expect(gridRange(turnos)).toEqual({ desde: 8, hasta: 20 })
  })

  it("sin turnos deja el rango por defecto", () => {
    expect(gridRange([])).toEqual({ desde: 8, hasta: 20 })
  })

  it("se estira hacia abajo por un turno que termina tarde", () => {
    const turnos = [turno("2026-09-07", "19:55", "20:50", "CONFIRMED")]

    expect(gridRange(turnos)).toEqual({ desde: 8, hasta: 21 })
  })

  it("se estira hacia arriba por un turno temprano", () => {
    const turnos = [turno("2026-09-07", "06:30", "07:15", "CONFIRMED")]

    expect(gridRange(turnos)).toEqual({ desde: 6, hasta: 20 })
  })

  // Filas de horas enteras: media hora en la regla de la izquierda se lee mal.
  it("redondea a la hora entera para los dos lados", () => {
    const turnos = [turno("2026-09-07", "06:59", "20:01", "CONFIRMED")]

    expect(gridRange(turnos)).toEqual({ desde: 6, hasta: 21 })
  })

  it("no pasa de 24: la grilla es de un día", () => {
    const turnos = [turno("2026-09-07", "23:00", "23:59", "CONFIRMED")]

    expect(gridRange(turnos).hasta).toBe(24)
  })
})
