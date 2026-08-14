import { describe, expect, it } from "vitest"
import { getWeekDates, layoutDay, type Placeable } from "./week"

/** Primer día con ese `getDay()` a partir de agosto 2026, sin hardcodear el calendario. */
function dateOn(dayOfWeek: number): Date {
  const d = new Date(2026, 7, 1)
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1)
  return d
}

const at = (id: string, startTime: string, endTime: string): Placeable => ({ id, startTime, endTime })

const lanesOf = (m: Map<string, { lane: number; lanes: number }>) =>
  Object.fromEntries([...m].map(([id, v]) => [id, `${v.lane}/${v.lanes}`]))

describe("getWeekDates", () => {
  it("devuelve 7 días consecutivos", () => {
    const week = getWeekDates(dateOn(3))

    expect(week).toHaveLength(7)
    for (let i = 1; i < week.length; i++) {
      const diff = week[i]!.getTime() - week[i - 1]!.getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000)
    }
  })

  it("arranca siempre en lunes, sea cual sea el día de referencia", () => {
    for (let day = 0; day < 7; day++) {
      expect(getWeekDates(dateOn(day))[0]!.getDay()).toBe(1)
    }
  })

  it("mete el domingo en la semana que arrancó el lunes anterior, no en la siguiente", () => {
    const sunday = dateOn(0)
    const week = getWeekDates(sunday)

    expect(week[6]!.toDateString()).toBe(sunday.toDateString())
    expect(sunday.getTime() - week[0]!.getTime()).toBe(6 * 24 * 60 * 60 * 1000)
  })

  it("cruza el fin de mes sin romperse", () => {
    const week = getWeekDates(new Date(2026, 6, 30)) // 30 de julio

    expect(week).toHaveLength(7)
    expect(new Set(week.map((d) => d.getMonth())).size).toBe(2)
  })

  it("no muta la fecha que recibe", () => {
    const ref = dateOn(4)
    const copy = new Date(ref)
    getWeekDates(ref)

    expect(ref.getTime()).toBe(copy.getTime())
  })
})

describe("layoutDay", () => {
  it("sin turnos devuelve un mapa vacío", () => {
    expect(layoutDay([]).size).toBe(0)
  })

  it("un turno solo ocupa la única columna", () => {
    expect(lanesOf(layoutDay([at("a", "09:00", "10:00")]))).toEqual({ a: "0/1" })
  })

  it("turnos que no se pisan van todos a la columna 0 y no se angostan", () => {
    const r = layoutDay([at("a", "09:00", "10:00"), at("b", "11:00", "12:00")])

    expect(lanesOf(r)).toEqual({ a: "0/1", b: "0/1" })
  })

  it("tocarse no es superponerse", () => {
    // a termina 10:00 y b empieza 10:00: ninguno tiene que angostarse.
    const r = layoutDay([at("a", "09:00", "10:00"), at("b", "10:00", "11:00")])

    expect(lanesOf(r)).toEqual({ a: "0/1", b: "0/1" })
  })

  it("dos superpuestos van a columnas distintas", () => {
    const r = layoutDay([at("a", "09:00", "10:30"), at("b", "10:00", "11:00")])

    expect(lanesOf(r)).toEqual({ a: "0/2", b: "1/2" })
  })

  it("tres superpuestos abren tres columnas", () => {
    const r = layoutDay([
      at("a", "09:00", "12:00"),
      at("b", "09:30", "12:00"),
      at("c", "10:00", "12:00"),
    ])

    expect(lanesOf(r)).toEqual({ a: "0/3", b: "1/3", c: "2/3" })
  })

  it("reutiliza una columna apenas queda libre", () => {
    // c empieza cuando a ya terminó, así que hereda su columna en vez de abrir una tercera.
    const r = layoutDay([
      at("a", "09:00", "10:00"),
      at("b", "09:00", "11:00"),
      at("c", "10:00", "11:00"),
    ])

    expect(lanesOf(r)).toEqual({ a: "0/2", b: "1/2", c: "0/2" })
  })

  it("un choque a la mañana no angosta los turnos de la tarde", () => {
    const r = layoutDay([
      at("a", "09:00", "10:30"),
      at("b", "10:00", "11:00"),
      at("tarde", "16:00", "17:00"),
    ])

    expect(lanesOf(r)).toEqual({ a: "0/2", b: "1/2", tarde: "0/1" })
  })

  it("un turno que solo toca al siguiente no se angosta por lo que pase después", () => {
    // a toca a b (10:00), y recién b se pisa con c. El cluster tiene que cortarse
    // en a: si no, a queda a media columna sin que nada se le superponga.
    const r = layoutDay([
      at("a", "09:00", "10:00"),
      at("b", "10:00", "11:00"),
      at("c", "10:30", "11:30"),
    ])

    expect(lanesOf(r)).toEqual({ a: "0/1", b: "0/2", c: "1/2" })
  })

  it("el orden de entrada no cambia el resultado", () => {
    const appts = [at("a", "09:00", "10:30"), at("b", "10:00", "11:00"), at("c", "16:00", "17:00")]
    const ordenado = lanesOf(layoutDay(appts))
    const alReves = lanesOf(layoutDay([...appts].reverse()))

    expect(alReves).toEqual(ordenado)
  })

  it("no muta el array que recibe", () => {
    const appts = [at("b", "10:00", "11:00"), at("a", "09:00", "10:30")]
    layoutDay(appts)

    expect(appts.map((a) => a.id)).toEqual(["b", "a"])
  })

  it("devuelve una entrada por turno", () => {
    const appts = Array.from({ length: 12 }, (_, i) =>
      at(`t${i}`, `09:${String(i * 5).padStart(2, "0")}`, "18:00"),
    )

    expect(layoutDay(appts).size).toBe(12)
  })
})
