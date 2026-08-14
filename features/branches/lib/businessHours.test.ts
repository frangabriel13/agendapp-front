import { describe, expect, it } from "vitest"
import type { BusinessHour } from "@/types"
import { summarize, toDrafts, toPayload, validateHours, type DayDraft } from "./businessHours"

const abierto = (dayOfWeek: number, opensAt = "09:00", closesAt = "18:00"): BusinessHour => ({
  dayOfWeek,
  isClosed: false,
  opensAt,
  closesAt,
})

/** Como los devuelve el backend: cerrado, con las horas en null. */
const cerrado = (dayOfWeek: number): BusinessHour => ({
  dayOfWeek,
  isClosed: true,
  opensAt: null,
  closesAt: null,
})

const draft = (dayOfWeek: number, isClosed: boolean, opensAt = "09:00", closesAt = "18:00"): DayDraft => ({
  dayOfWeek,
  isClosed,
  opensAt,
  closesAt,
})

const LUN_A_VIE = [1, 2, 3, 4, 5].map((d) => abierto(d))
const SEMANA_COMPLETA = [...LUN_A_VIE, cerrado(6), cerrado(0)]

describe("toDrafts", () => {
  it("siempre devuelve los 7 días, en orden de lectura", () => {
    const drafts = toDrafts(SEMANA_COMPLETA)

    expect(drafts).toHaveLength(7)
    expect(drafts.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it("completa como cerrados los días que el backend no mandó", () => {
    // Defensivo: el contrato dice 7, pero asumirlo dejaría días sin fila.
    const drafts = toDrafts([abierto(1)])

    expect(drafts).toHaveLength(7)
    expect(drafts.filter((d) => !d.isClosed).map((d) => d.dayOfWeek)).toEqual([1])
  })

  it("rellena las horas nulas de un día cerrado para que el input no quede vacío", () => {
    const domingo = toDrafts([cerrado(0)]).find((d) => d.dayOfWeek === 0)!

    expect(domingo.isClosed).toBe(true)
    expect(domingo.opensAt).toBe("09:00")
    expect(domingo.closesAt).toBe("18:00")
  })
})

describe("toPayload", () => {
  it("omite las horas de los días cerrados en vez de mandarlas en null", () => {
    // Mandar `opensAt: null` es un 400. Este es el error que más caro sale.
    const payload = toPayload([draft(6, true)])

    expect(payload[0]).toEqual({ dayOfWeek: 6, isClosed: true })
    expect(payload[0]).not.toHaveProperty("opensAt")
    expect(payload[0]).not.toHaveProperty("closesAt")
  })

  it("manda las horas de los días abiertos", () => {
    expect(toPayload([draft(1, false, "10:00", "19:00")])[0]).toEqual({
      dayOfWeek: 1,
      isClosed: false,
      opensAt: "10:00",
      closesAt: "19:00",
    })
  })

  it("sale ordenado desde el lunes, no desde el domingo", () => {
    const payload = toPayload([draft(0, false), draft(1, false), draft(6, false)])

    expect(payload.map((d) => d.dayOfWeek)).toEqual([1, 6, 0])
  })

  it("no muta el array que recibe", () => {
    const drafts = [draft(0, false), draft(1, false)]
    toPayload(drafts)

    expect(drafts.map((d) => d.dayOfWeek)).toEqual([0, 1])
  })

  it("manda los siete días completos", () => {
    expect(toPayload(toDrafts(SEMANA_COMPLETA))).toHaveLength(7)
  })
})

describe("validateHours", () => {
  it("acepta una semana sana", () => {
    expect(validateHours(toDrafts(SEMANA_COMPLETA)).size).toBe(0)
  })

  it("un día cerrado nunca falla, aunque sus horas no tengan sentido", () => {
    expect(validateHours([draft(0, true, "18:00", "09:00")]).size).toBe(0)
  })

  it("rechaza el cierre anterior a la apertura", () => {
    expect(validateHours([draft(1, false, "18:00", "09:00")]).get(1)).toBe(
      "El cierre tiene que ser posterior a la apertura",
    )
  })

  it("rechaza la duración cero", () => {
    expect(validateHours([draft(1, false, "09:00", "09:00")]).get(1)).toBe(
      "El cierre tiene que ser posterior a la apertura",
    )
  })

  it("exige las dos horas en un día abierto", () => {
    expect(validateHours([draft(1, false, "", "18:00")]).get(1)).toBe("Completá las dos horas")
  })
})

describe("summarize", () => {
  it("agrupa los días seguidos con el mismo horario", () => {
    expect(summarize(SEMANA_COMPLETA)).toBe("Lun a Vie 09:00–18:00")
  })

  it("separa el tramo que abre distinto", () => {
    expect(summarize([...LUN_A_VIE, abierto(6, "09:00", "13:00"), cerrado(0)])).toBe(
      "Lun a Vie 09:00–18:00 · Sáb 09:00–13:00",
    )
  })

  it("no agrupa días que no son consecutivos", () => {
    // Lunes y miércoles abren igual, pero el martes cierra en el medio.
    expect(summarize([abierto(1), cerrado(2), abierto(3)])).toBe("Lun 09:00–18:00 · Mié 09:00–18:00")
  })

  it("un solo día no dice 'a'", () => {
    expect(summarize([abierto(3)])).toBe("Mié 09:00–18:00")
  })

  it("lo dice cuando no abre ningún día", () => {
    expect(summarize([cerrado(1), cerrado(2)])).toBe("Cerrada toda la semana")
    expect(summarize([])).toBe("Cerrada toda la semana")
  })

  it("agrupa hasta el domingo, que va último", () => {
    const todos = [1, 2, 3, 4, 5, 6, 0].map((d) => abierto(d))

    expect(summarize(todos)).toBe("Lun a Dom 09:00–18:00")
  })
})
