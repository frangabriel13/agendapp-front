import { afterEach, describe, expect, it } from "vitest"
import { setBusinessTimezone } from "@/lib/time"
import {
  draftToPayload,
  formatRange,
  isAllDay,
  isPast,
  sortTimeOff,
  toDateInput,
  toInstant,
  toTimeInput,
  validateDraft,
  type TimeOffDraft,
} from "./timeOff"
import type { TimeOff } from "@/types"

/**
 * Los instantes se arman con `new Date(...)` local en vez de literales ISO: así
 * los tests dan igual en cualquier zona horaria, que es justo lo que se prueba.
 */
const iso = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0).toISOString()

const draft = (overrides: Partial<TimeOffDraft> = {}): TimeOffDraft => ({
  allDay: true,
  startDate: "2026-08-20",
  startTime: "09:00",
  endDate: "2026-08-22",
  endTime: "18:00",
  branchId: "",
  reason: "",
  ...overrides,
})

describe("toInstant y la vuelta", () => {
  it("interpreta la hora escrita como hora local, no como UTC", () => {
    const instant = toInstant("2026-08-20", "09:00")

    expect(toDateInput(instant)).toBe("2026-08-20")
    expect(toTimeInput(instant)).toBe("09:00")
  })

  it("devuelve un ISO válido", () => {
    expect(Number.isNaN(new Date(toInstant("2026-08-20", "09:00")).getTime())).toBe(false)
  })

  it("respeta el cruce de medianoche", () => {
    expect(toTimeInput(toInstant("2026-08-20", "23:59"))).toBe("23:59")
    expect(toDateInput(toInstant("2026-08-20", "00:00"))).toBe("2026-08-20")
  })
})

describe("isAllDay", () => {
  it("reconoce el rango de día completo que guarda el formulario", () => {
    expect(isAllDay(iso(2026, 8, 20, 0, 0), iso(2026, 8, 22, 23, 59))).toBe(true)
  })

  it("no confunde un tramo parcial con día completo", () => {
    expect(isAllDay(iso(2026, 8, 20, 9, 0), iso(2026, 8, 20, 13, 0))).toBe(false)
    expect(isAllDay(iso(2026, 8, 20, 0, 0), iso(2026, 8, 20, 18, 0))).toBe(false)
  })
})

describe("draftToPayload", () => {
  it("estira el día completo de 00:00 a 23:59", () => {
    const payload = draftToPayload(draft({ allDay: true }))

    expect(toTimeInput(payload.startsAt)).toBe("00:00")
    expect(toTimeInput(payload.endsAt)).toBe("23:59")
    expect(isAllDay(payload.startsAt, payload.endsAt)).toBe(true)
  })

  it("usa las horas cargadas cuando no es día completo", () => {
    const payload = draftToPayload(draft({ allDay: false, startTime: "09:30", endTime: "13:15" }))

    expect(toTimeInput(payload.startsAt)).toBe("09:30")
    expect(toTimeInput(payload.endsAt)).toBe("13:15")
  })

  it("omite los opcionales vacíos en vez de mandarlos", () => {
    // El backend corre con `forbidNonWhitelisted`; un `reason: ""` es basura.
    const payload = draftToPayload(draft({ branchId: "", reason: "   " }))

    expect(payload).not.toHaveProperty("branchId")
    expect(payload).not.toHaveProperty("reason")
  })

  it("manda los opcionales cuando tienen contenido, con el motivo recortado", () => {
    const payload = draftToPayload(draft({ branchId: "b-1", reason: "  Vacaciones  " }))

    expect(payload.branchId).toBe("b-1")
    expect(payload.reason).toBe("Vacaciones")
  })
})

describe("validateDraft", () => {
  it("acepta un rango sano", () => {
    expect(validateDraft(draft())).toBeNull()
    expect(validateDraft(draft({ allDay: false, endDate: "2026-08-20" }))).toBeNull()
  })

  it("exige las dos fechas", () => {
    expect(validateDraft(draft({ startDate: "" }))).toBe("Completá las dos fechas")
    expect(validateDraft(draft({ endDate: "" }))).toBe("Completá las dos fechas")
  })

  it("exige las horas solo si no es día completo", () => {
    expect(validateDraft(draft({ allDay: true, startTime: "" }))).toBeNull()
    expect(validateDraft(draft({ allDay: false, startTime: "" }))).toBe("Completá las dos horas")
  })

  it("rechaza el rango invertido", () => {
    expect(validateDraft(draft({ startDate: "2026-08-22", endDate: "2026-08-20" }))).toBe(
      "El fin tiene que ser posterior al inicio",
    )
  })

  it("rechaza duración cero", () => {
    expect(
      validateDraft(draft({ allDay: false, endDate: "2026-08-20", startTime: "09:00", endTime: "09:00" })),
    ).toBe("El fin tiene que ser posterior al inicio")
  })

  it("un solo día en modo día completo es válido, no duración cero", () => {
    // 00:00 a 23:59 del mismo día: el caso más común de todos.
    expect(validateDraft(draft({ allDay: true, startDate: "2026-08-20", endDate: "2026-08-20" }))).toBeNull()
  })
})

describe("formatRange", () => {
  it("no repite el día cuando empieza y termina el mismo", () => {
    const text = formatRange(iso(2026, 8, 20, 9, 0), iso(2026, 8, 20, 13, 0))

    expect(text).toContain("09:00")
    expect(text).toContain("13:00")
    expect(text.match(/20/g)).toHaveLength(1)
  })

  it("dice 'todo el día' en vez de mostrar 00:00 a 23:59", () => {
    const text = formatRange(iso(2026, 8, 20, 0, 0), iso(2026, 8, 20, 23, 59))

    expect(text).toContain("todo el día")
    expect(text).not.toContain("23:59")
  })

  it("muestra las dos puntas cuando cruza días", () => {
    const text = formatRange(iso(2026, 8, 20, 0, 0), iso(2026, 8, 22, 23, 59))

    expect(text).toContain("20")
    expect(text).toContain("22")
    expect(text).toContain("todo el día")
  })
})

describe("sortTimeOff", () => {
  const ahora = new Date(2026, 7, 15, 12, 0)
  const item = (id: string, mes: number, dia: number): TimeOff => ({
    id,
    employeeId: "e-1",
    branchId: null,
    startsAt: iso(2026, mes, dia, 9, 0),
    endsAt: iso(2026, mes, dia, 18, 0),
    reason: null,
  })

  it("pone las vigentes antes que las pasadas", () => {
    const result = sortTimeOff([item("vieja", 7, 1), item("proxima", 9, 1)], ahora)

    expect(result.map((i) => i.id)).toEqual(["proxima", "vieja"])
  })

  it("entre las vigentes, la más próxima primero", () => {
    const result = sortTimeOff([item("lejana", 12, 1), item("cercana", 9, 1)], ahora)

    expect(result.map((i) => i.id)).toEqual(["cercana", "lejana"])
  })

  it("entre las pasadas, la más reciente primero", () => {
    const result = sortTimeOff([item("antigua", 1, 1), item("reciente", 7, 1)], ahora)

    expect(result.map((i) => i.id)).toEqual(["reciente", "antigua"])
  })

  it("no muta el array que recibe", () => {
    const items = [item("b", 12, 1), item("a", 9, 1)]
    sortTimeOff(items, ahora)

    expect(items.map((i) => i.id)).toEqual(["b", "a"])
  })
})

describe("isPast", () => {
  it("una ausencia en curso no cuenta como pasada", () => {
    const ahora = new Date(2026, 7, 15, 12, 0)

    expect(isPast({ endsAt: iso(2026, 8, 15, 18, 0) }, ahora)).toBe(false)
    expect(isPast({ endsAt: iso(2026, 8, 15, 11, 0) }, ahora)).toBe(true)
  })
})

/**
 * El resto del archivo corre con la zona del negocio sin fijar, o sea la del
 * navegador —que en los tests es Buenos Aires—, así que **no distinguiría** una
 * conversión atada al navegador de una atada al negocio. Este bloque fija otra
 * zona y ahí sí se ve la diferencia: era el bug que tenía la copia propia de
 * `toInstant` que vivía en este archivo.
 */
describe("la zona del negocio manda sobre la del navegador", () => {
  afterEach(() => setBusinessTimezone(null))

  it("guarda la hora de pared del negocio, no la de quien carga", () => {
    setBusinessTimezone("America/Mexico_City") // UTC−6 en agosto

    expect(toInstant("2026-08-20", "09:00")).toBe("2026-08-20T15:00:00.000Z")
  })

  it("relee esa hora igual que como se guardó", () => {
    setBusinessTimezone("America/Mexico_City")

    expect(toDateInput("2026-08-20T15:00:00.000Z")).toBe("2026-08-20")
    expect(toTimeInput("2026-08-20T15:00:00.000Z")).toBe("09:00")
  })

  /** Un día completo son las 00:00 y las 23:59 **del negocio**. */
  it("reconoce el día completo en la zona del negocio", () => {
    setBusinessTimezone("America/Mexico_City")

    const payload = draftToPayload({
      allDay: true,
      startDate: "2026-08-20",
      startTime: "",
      endDate: "2026-08-22",
      endTime: "",
      branchId: "",
      reason: "",
    })

    expect(isAllDay(payload.startsAt, payload.endsAt)).toBe(true)
    // Las 00:00 de México son las 03:00 de Buenos Aires, que es la zona del
    // navegador en los tests: si `isAllDay` mirara la hora local vería un 3 y
    // diría que no es día completo.
    expect(new Date(payload.startsAt).getHours()).toBe(3)
  })
})
