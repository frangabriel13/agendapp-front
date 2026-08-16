import { describe, expect, it } from "vitest"
import type { SpecialDay } from "@/types"
import {
  draftToPayload,
  formatCalendarDay,
  isPastDay,
  sortSpecialDays,
  validateSpecialDay,
  type SpecialDayDraft,
} from "./specialDays"

const draft = (overrides: Partial<SpecialDayDraft> = {}): SpecialDayDraft => ({
  date: "2026-12-25",
  isClosed: true,
  opensAt: "10:00",
  closesAt: "14:00",
  description: "",
  ...overrides,
})

describe("formatCalendarDay", () => {
  // El parseo en sí se prueba en `lib/time.test.ts`; acá interesa que el texto
  // que ve la persona no se corra de día.
  it("muestra el día correcto", () => {
    expect(formatCalendarDay("2026-12-25")).toContain("25")
  })
})

describe("validateSpecialDay", () => {
  it("un día cerrado no necesita horas", () => {
    expect(validateSpecialDay(draft({ isClosed: true, opensAt: "", closesAt: "" }))).toBeNull()
  })

  it("un horario especial sí las necesita", () => {
    expect(validateSpecialDay(draft({ isClosed: false, opensAt: "", closesAt: "14:00" }))).toBe(
      "Completá las dos horas",
    )
  })

  it("exige la fecha", () => {
    expect(validateSpecialDay(draft({ date: "" }))).toBe("Elegí una fecha")
  })

  it("rechaza el cierre anterior a la apertura", () => {
    expect(validateSpecialDay(draft({ isClosed: false, opensAt: "14:00", closesAt: "10:00" }))).toBe(
      "El cierre tiene que ser posterior a la apertura",
    )
  })

  it("rechaza la duración cero", () => {
    expect(validateSpecialDay(draft({ isClosed: false, opensAt: "10:00", closesAt: "10:00" }))).toBe(
      "El cierre tiene que ser posterior a la apertura",
    )
  })

  it("acepta un horario especial válido", () => {
    expect(validateSpecialDay(draft({ isClosed: false }))).toBeNull()
  })
})

describe("draftToPayload", () => {
  it("un día cerrado va sin horas", () => {
    const payload = draftToPayload(draft({ isClosed: true }))

    expect(payload).not.toHaveProperty("opensAt")
    expect(payload).not.toHaveProperty("closesAt")
    expect(payload.isClosed).toBe(true)
  })

  it("un horario especial las lleva", () => {
    expect(draftToPayload(draft({ isClosed: false }))).toMatchObject({
      isClosed: false,
      opensAt: "10:00",
      closesAt: "14:00",
    })
  })

  it("omite la descripción vacía y recorta la que tiene contenido", () => {
    expect(draftToPayload(draft({ description: "   " }))).not.toHaveProperty("description")
    expect(draftToPayload(draft({ description: "  Navidad  " })).description).toBe("Navidad")
  })
})

describe("sortSpecialDays e isPastDay", () => {
  const hoy = new Date(2026, 7, 15)
  const dia = (id: string, date: string): SpecialDay => ({
    id,
    date,
    isClosed: true,
    opensAt: null,
    closesAt: null,
    description: null,
  })

  it("el día de hoy no cuenta como pasado", () => {
    expect(isPastDay("2026-08-15", hoy)).toBe(false)
    expect(isPastDay("2026-08-14", hoy)).toBe(true)
  })

  it("pone los próximos antes que los pasados", () => {
    const result = sortSpecialDays([dia("viejo", "2026-01-01"), dia("proximo", "2026-12-25")], hoy)

    expect(result.map((d) => d.id)).toEqual(["proximo", "viejo"])
  })

  it("entre los próximos, el más cercano primero", () => {
    const result = sortSpecialDays([dia("lejos", "2026-12-25"), dia("cerca", "2026-09-01")], hoy)

    expect(result.map((d) => d.id)).toEqual(["cerca", "lejos"])
  })

  it("entre los pasados, el más reciente primero", () => {
    const result = sortSpecialDays([dia("antiguo", "2026-01-01"), dia("reciente", "2026-07-01")], hoy)

    expect(result.map((d) => d.id)).toEqual(["reciente", "antiguo"])
  })

  it("no muta el array que recibe", () => {
    const dias = [dia("b", "2026-12-25"), dia("a", "2026-09-01")]
    sortSpecialDays(dias, hoy)

    expect(dias.map((d) => d.id)).toEqual(["b", "a"])
  })
})
